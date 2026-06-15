// src/services/report.service.js
const { sequelize } = require("../models");
const { Op } = require("sequelize");
const busRepository = require("../repositories/bus.repository");
const driverRepository = require("../repositories/driver.repository");
const routeRepository = require("../repositories/route.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const fuelLogRepository = require("../repositories/fuelLog.repository");
const maintenanceRepository = require("../repositories/maintenance.repository");
const ticketRepository = require("../repositories/ticket.repository");

class ReportService {

    // ==================== FUEL REPORTS ====================

    static async getFuelReport(busId, startDate, endDate) {
        const where = {};
        if (busId) where.bus_id = busId;
        if (startDate && endDate) {
            where.fuel_date = { [Op.between]: [startDate, endDate] };
        }

        const fuelLogs = await fuelLogRepository.findAll(where);

        // Get bus details
        let bus = null;
        if (busId) {
            bus = await busRepository.findById(busId);
        }

        const totalFuel = fuelLogs.reduce((sum, log) => sum + parseFloat(log.fuel_amount), 0);
        const totalCost = fuelLogs.reduce((sum, log) => sum + parseFloat(log.total_cost), 0);
        const avgCostPerLiter = totalFuel > 0 ? totalCost / totalFuel : 0;

        // Calculate average efficiency
        let totalEfficiency = 0;
        let efficiencyCount = 0;
        fuelLogs.forEach(log => {
            if (log.fuel_efficiency) {
                totalEfficiency += parseFloat(log.fuel_efficiency);
                efficiencyCount++;
            }
        });
        const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;

        // Group by fuel type
        const byFuelType = {};
        fuelLogs.forEach(log => {
            const type = log.fuel_type;
            if (!byFuelType[type]) {
                byFuelType[type] = { totalFuel: 0, totalCost: 0, count: 0 };
            }
            byFuelType[type].totalFuel += parseFloat(log.fuel_amount);
            byFuelType[type].totalCost += parseFloat(log.total_cost);
            byFuelType[type].count++;
        });

        // Daily summary
        const dailySummary = {};
        fuelLogs.forEach(log => {
            const date = log.fuel_date;
            if (!dailySummary[date]) {
                dailySummary[date] = { fuelAmount: 0, cost: 0 };
            }
            dailySummary[date].fuelAmount += parseFloat(log.fuel_amount);
            dailySummary[date].cost += parseFloat(log.total_cost);
        });

        return {
            reportType: "Fuel Consumption Report",
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            bus: bus ? {
                bus_id: bus.bus_id,
                registration_number: bus.registration_number,
                bus_model: bus.bus_model,
                fuel_type: bus.fuel_type
            } : null,
            summary: {
                totalFuelLiters: totalFuel.toFixed(2),
                totalCost: totalCost.toFixed(2),
                averageCostPerLiter: avgCostPerLiter.toFixed(2),
                averageEfficiency: avgEfficiency.toFixed(2),
                totalRefuels: fuelLogs.length
            },
            byFuelType: byFuelType,
            dailySummary: dailySummary,
            details: fuelLogs.map(log => ({
                date: log.fuel_date,
                fuelAmount: log.fuel_amount,
                costPerLiter: log.cost_per_liter,
                totalCost: log.total_cost,
                odometerReading: log.odometer_reading,
                refuelingLocation: log.refueling_location,
                vendor: log.vendor_name
            }))
        };
    }

    // ==================== MAINTENANCE REPORTS ====================

    static async getMaintenanceReport(busId, startDate, endDate) {
        const where = {};
        if (busId) where.bus_id = busId;
        if (startDate && endDate) {
            where.maintenance_date = { [Op.between]: [startDate, endDate] };
        }

        const logs = await maintenanceRepository.findAll(where);

        let bus = null;
        if (busId) {
            bus = await busRepository.findById(busId);
        }

        const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.cost), 0);

        // Group by maintenance type
        const byType = {};
        const byCategory = {};

        logs.forEach(log => {
            const type = log.maintenance_type;
            const category = log.maintenance_category;

            if (!byType[type]) {
                byType[type] = { count: 0, totalCost: 0 };
            }
            byType[type].count++;
            byType[type].totalCost += parseFloat(log.cost);

            if (!byCategory[category]) {
                byCategory[category] = { count: 0, totalCost: 0 };
            }
            byCategory[category].count++;
            byCategory[category].totalCost += parseFloat(log.cost);
        });

        // Upcoming maintenance
        const upcoming = await maintenanceRepository.getUpcomingMaintenance(30);

        return {
            reportType: "Maintenance Report",
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            bus: bus ? {
                bus_id: bus.bus_id,
                registration_number: bus.registration_number,
                bus_model: bus.bus_model
            } : null,
            summary: {
                totalMaintenanceJobs: logs.length,
                totalCost: totalCost.toFixed(2),
                averageCostPerJob: logs.length > 0 ? (totalCost / logs.length).toFixed(2) : 0,
                upcomingMaintenanceCount: upcoming.length
            },
            byType: byType,
            byCategory: byCategory,
            upcomingMaintenance: upcoming.map(log => ({
                bus: log.Bus?.registration_number,
                dueDate: log.next_due_date,
                description: log.description,
                estimatedCost: log.cost
            })),
            details: logs.map(log => ({
                date: log.maintenance_date,
                type: log.maintenance_type,
                category: log.maintenance_category,
                description: log.description,
                cost: log.cost,
                vendor: log.vendor_name,
                status: log.status,
                odometer: log.odometer_at_service
            }))
        };
    }

    // ==================== REVENUE REPORTS ====================

    static async getRevenueReport(startDate, endDate) {
        const tickets = await ticketRepository.findAll({
            travel_date: { [Op.between]: [startDate, endDate] }
        });

        const confirmedTickets = tickets.filter(t => t.booking_status === "confirmed");
        const usedTickets = tickets.filter(t => t.booking_status === "used");
        const cancelledTickets = tickets.filter(t => t.booking_status === "cancelled");

        const totalRevenue = usedTickets.reduce((sum, t) => sum + parseFloat(t.fare_amount), 0);

        // Group by payment method
        const byPaymentMethod = {};
        usedTickets.forEach(ticket => {
            const method = ticket.payment_method;
            if (!byPaymentMethod[method]) {
                byPaymentMethod[method] = { count: 0, revenue: 0 };
            }
            byPaymentMethod[method].count++;
            byPaymentMethod[method].revenue += parseFloat(ticket.fare_amount);
        });

        // Daily revenue
        const dailyRevenue = {};
        usedTickets.forEach(ticket => {
            const date = ticket.travel_date;
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = { tickets: 0, revenue: 0 };
            }
            dailyRevenue[date].tickets++;
            dailyRevenue[date].revenue += parseFloat(ticket.fare_amount);
        });

        // Top routes by revenue
        const [topRoutes] = await sequelize.query(`
            SELECT 
                r.route_name,
                r.route_code,
                COUNT(t.ticket_id) as tickets_sold,
                SUM(t.fare_amount) as revenue
            FROM srmss_ticket t
            JOIN srmss_schedule s ON t.schedule_id = s.schedule_id
            JOIN srmss_route r ON s.route_id = r.route_id
            WHERE t.travel_date BETWEEN :startDate AND :endDate
            AND t.booking_status = 'used'
            GROUP BY r.route_id
            ORDER BY revenue DESC
            LIMIT 5
        `, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            reportType: "Revenue Report",
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            summary: {
                totalTicketsSold: usedTickets.length,
                totalTicketsBooked: confirmedTickets.length,
                totalCancelled: cancelledTickets.length,
                totalRevenue: totalRevenue.toFixed(2),
                averageTicketPrice: usedTickets.length > 0 ? (totalRevenue / usedTickets.length).toFixed(2) : 0,
                cancellationRate: tickets.length > 0 ? ((cancelledTickets.length / tickets.length) * 100).toFixed(2) : 0
            },
            byPaymentMethod: byPaymentMethod,
            dailyRevenue: dailyRevenue,
            topRoutes: topRoutes,
            details: usedTickets.map(ticket => ({
                ticketNumber: ticket.ticket_number,
                passengerName: ticket.passenger_name,
                route: ticket.schedule?.Route?.route_name || "N/A",
                travelDate: ticket.travel_date,
                fromStop: ticket.from_stop_name,
                toStop: ticket.to_stop_name,
                fare: ticket.fare_amount,
                paymentMethod: ticket.payment_method
            }))
        };
    }

    // ==================== OPERATIONAL REPORT ====================

    static async getOperationalReport(startDate, endDate) {
        // Schedule statistics
        const schedules = await scheduleRepository.findAll({
            from_date: startDate,
            to_date: endDate
        });

        const completedSchedules = schedules.filter(s => s.trip_status === "completed");
        const delayedSchedules = schedules.filter(s => s.trip_status === "delayed");
        const cancelledSchedules = schedules.filter(s => s.trip_status === "cancelled");
        const onTimeSchedules = schedules.filter(s => s.trip_status === "on_time");

        const totalPassengers = completedSchedules.reduce((sum, s) => sum + (s.passenger_count || 0), 0);
        const totalRevenue = completedSchedules.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);

        // On-time performance
        const onTimeRate = schedules.length > 0 ? (onTimeSchedules.length / schedules.length * 100).toFixed(2) : 0;

        // Average delay
        const avgDelay = delayedSchedules.length > 0
            ? (delayedSchedules.reduce((sum, s) => sum + (s.delay_minutes || 0), 0) / delayedSchedules.length).toFixed(2)
            : 0;

        // Route performance
        const [routePerformance] = await sequelize.query(`
            SELECT 
                r.route_name,
                r.route_code,
                COUNT(s.schedule_id) as total_trips,
                SUM(CASE WHEN s.trip_status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
                SUM(CASE WHEN s.trip_status = 'delayed' THEN 1 ELSE 0 END) as delayed_trips,
                AVG(s.delay_minutes) as avg_delay,
                SUM(s.passenger_count) as total_passengers,
                SUM(s.revenue) as total_revenue,
                ROUND(AVG(s.passenger_count / b.capacity * 100), 1) as avg_occupancy
            FROM srmss_route r
            LEFT JOIN srmss_schedule s ON r.route_id = s.route_id
            LEFT JOIN srmss_bus b ON s.bus_id = b.bus_id
            WHERE s.departure_time BETWEEN :startDate AND :endDate
            GROUP BY r.route_id
            ORDER BY total_revenue DESC
        `, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        // Driver performance
        const [driverPerformance] = await sequelize.query(`
            SELECT 
                d.driver_id,
                d.driver_code,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                d.rating,
                COUNT(s.schedule_id) as total_trips,
                SUM(CASE WHEN s.trip_status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
                SUM(CASE WHEN s.trip_status = 'delayed' THEN 1 ELSE 0 END) as delayed_trips,
                AVG(s.delay_minutes) as avg_delay,
                SUM(s.passenger_count) as total_passengers,
                SUM(s.revenue) as total_revenue
            FROM srmss_driver d
            LEFT JOIN srmss_schedule s ON d.driver_id = s.driver_id
            WHERE s.departure_time BETWEEN :startDate AND :endDate
            GROUP BY d.driver_id
            ORDER BY rating DESC
        `, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        // Bus utilization
        const [busUtilization] = await sequelize.query(`
            SELECT 
                b.bus_id,
                b.registration_number,
                b.bus_model,
                COUNT(s.schedule_id) as total_trips,
                SUM(s.passenger_count) as total_passengers,
                ROUND(AVG(s.passenger_count / b.capacity * 100), 1) as avg_occupancy,
                SUM(s.revenue) as total_revenue
            FROM srmss_bus b
            LEFT JOIN srmss_schedule s ON b.bus_id = s.bus_id
            WHERE s.departure_time BETWEEN :startDate AND :endDate
            GROUP BY b.bus_id
            ORDER BY avg_occupancy DESC
        `, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            reportType: "Operational Performance Report",
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            summary: {
                totalSchedules: schedules.length,
                completedTrips: completedSchedules.length,
                delayedTrips: delayedSchedules.length,
                cancelledTrips: cancelledSchedules.length,
                onTimeRate: onTimeRate,
                averageDelayMinutes: avgDelay,
                totalPassengers: totalPassengers,
                totalRevenue: totalRevenue.toFixed(2),
                averagePassengersPerTrip: schedules.length > 0 ? (totalPassengers / schedules.length).toFixed(2) : 0
            },
            routePerformance: routePerformance,
            driverPerformance: driverPerformance,
            busUtilization: busUtilization,
            details: schedules.slice(0, 100).map(s => ({
                scheduleCode: s.schedule_code,
                route: s.Route?.route_name,
                bus: s.Bus?.registration_number,
                driver: s.Driver ? `${s.Driver.first_name} ${s.Driver.last_name}` : "N/A",
                departureTime: s.departure_time,
                status: s.trip_status,
                delayMinutes: s.delay_minutes,
                passengers: s.passenger_count,
                revenue: s.revenue
            }))
        };
    }

    // ==================== FLEET UTILIZATION REPORT ====================

    static async getFleetUtilizationReport() {
        const busStats = await busRepository.getStatistics();
        const driverStats = await driverRepository.getStatistics();

        // Buses by type
        const [busesByType] = await sequelize.query(`
            SELECT 
                bus_type,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'on_route' THEN 1 ELSE 0 END) as on_route,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as in_maintenance
            FROM srmss_bus
            GROUP BY bus_type
        `);

        // Buses by fuel type
        const [busesByFuel] = await sequelize.query(`
            SELECT 
                fuel_type,
                COUNT(*) as count,
                SUM(capacity) as total_capacity,
                AVG(mileage) as avg_mileage
            FROM srmss_bus
            GROUP BY fuel_type
        `);

        // Maintenance summary
        const [maintenanceSummary] = await sequelize.query(`
            SELECT 
                maintenance_type,
                COUNT(*) as count,
                SUM(cost) as total_cost,
                AVG(cost) as avg_cost
            FROM srmss_maintenance_log
            WHERE maintenance_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            GROUP BY maintenance_type
        `);

        return {
            reportType: "Fleet Utilization Report",
            generatedAt: new Date().toISOString(),
            summary: {
                totalBuses: busStats.total_buses || 0,
                availableBuses: busStats.available || 0,
                onRouteBuses: busStats.on_route || 0,
                maintenanceBuses: busStats.maintenance || 0,
                inactiveBuses: busStats.inactive || 0,
                utilizationRate: busStats.total_buses > 0
                    ? (((busStats.total_buses - (busStats.maintenance || 0) - (busStats.inactive || 0)) / busStats.total_buses) * 100).toFixed(2)
                    : 0,
                totalDrivers: driverStats.total_drivers || 0,
                availableDrivers: driverStats.available || 0,
                driversOnDuty: driverStats.on_duty || 0,
                totalCapacity: busStats.total_capacity || 0,
                averageCapacity: busStats.avg_capacity || 0,
                averageMileage: busStats.avg_mileage || 0
            },
            busesByType: busesByType,
            busesByFuel: busesByFuel,
            maintenanceSummary: maintenanceSummary,
            totalFuelCostLast90Days: await this.getTotalFuelCost(90),
            totalMaintenanceCostLast90Days: maintenanceSummary.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0)
        };
    }

    static async getTotalFuelCost(days) {
        const [result] = await sequelize.query(`
            SELECT SUM(total_cost) as total_cost
            FROM srmss_fuel_log
            WHERE fuel_date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        `, {
            replacements: { days },
            type: sequelize.QueryTypes.SELECT
        });
        return result.total_cost || 0;
    }

    // ==================== COMBINED DASHBOARD REPORT ====================

    static async getCompleteDashboardReport(startDate, endDate) {
        const [fuelReport, maintenanceReport, revenueReport, operationalReport, fleetReport] = await Promise.all([
            this.getFuelReport(null, startDate, endDate),
            this.getMaintenanceReport(null, startDate, endDate),
            this.getRevenueReport(startDate, endDate),
            this.getOperationalReport(startDate, endDate),
            this.getFleetUtilizationReport()
        ]);

        return {
            reportType: "Complete SRMSS Dashboard Report",
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            executiveSummary: {
                totalRevenue: revenueReport.summary.totalRevenue,
                totalTripsCompleted: operationalReport.summary.completedTrips,
                totalPassengers: operationalReport.summary.totalPassengers,
                onTimeRate: operationalReport.summary.onTimeRate,
                fleetUtilization: fleetReport.summary.utilizationRate,
                totalFuelCost: fuelReport.summary.totalCost,
                totalMaintenanceCost: maintenanceReport.summary.totalCost,
                netProfit: (parseFloat(revenueReport.summary.totalRevenue) -
                    parseFloat(fuelReport.summary.totalCost) -
                    parseFloat(maintenanceReport.summary.totalCost)).toFixed(2)
            },
            fuelReport: fuelReport,
            maintenanceReport: maintenanceReport,
            revenueReport: revenueReport,
            operationalReport: operationalReport,
            fleetReport: fleetReport
        };
    }
}

module.exports = ReportService;