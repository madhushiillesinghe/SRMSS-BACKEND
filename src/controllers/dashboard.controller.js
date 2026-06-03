const routeRepository = require("../repositories/route.repository");
const busRepository = require("../repositories/bus.repository");
const driverRepository = require("../repositories/driver.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const ticketRepository = require("../repositories/ticket.repository");
const fuelLogRepository = require("../repositories/fuelLog.repository");
const maintenanceRepository = require("../repositories/maintenance.repository");
const trackingService = require("../services/tracking.service");
const { sequelize } = require("../models");
const getDashboardStats = async (req, res, next) => {
    try {
        const [
            routeStats,
            busStats,
            driverStats,
            scheduleStats,
            ticketStats,
            fuelStats,
            maintenanceStats,
            activeBuses
        ] = await Promise.all([
            routeRepository.getStatistics(),
            busRepository.getStatistics(),
            driverRepository.getStatistics(),
            scheduleRepository.getStatistics(),
            ticketRepository.getStatistics(
                new Date(new Date().setDate(1)).toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            ),
            fuelLogRepository.getStatistics(null, 30),
            maintenanceRepository.getStatistics(null, 30),
            trackingService.getAllActiveBusesLocations()
        ]);

        // Get today's schedule
        const todaySchedules = await scheduleRepository.findTodaySchedules();
        const todayCompleted = todaySchedules.filter(s => s.trip_status === "completed").length;
        const todayDelayed = todaySchedules.filter(s => s.trip_status === "delayed").length;
        const todayOnTime = todaySchedules.filter(s => s.trip_status === "on_time").length;

        // Get upcoming schedules
        const upcomingSchedules = await scheduleRepository.findUpcomingSchedules(5);

        // Get recent activities
        const recentTickets = await ticketRepository.findAll({ limit: 5 });
        const recentFuelLogs = await fuelLogRepository.findAll({ limit: 5 });

        res.json({
            success: true,
            message: "Dashboard statistics retrieved successfully",
            data: {
                summary: {
                    total_routes: routeStats.total || 0,
                    active_routes: routeStats.active || 0,
                    total_buses: busStats.total || 0,
                    available_buses: busStats.available || 0,
                    total_drivers: driverStats.total || 0,
                    available_drivers: driverStats.available || 0,
                    active_buses_tracking: activeBuses.length || 0
                },
                today: {
                    total_schedules: todaySchedules.length,
                    completed: todayCompleted,
                    delayed: todayDelayed,
                    on_time: todayOnTime,
                    on_time_rate: todaySchedules.length > 0 ? (todayOnTime / todaySchedules.length * 100).toFixed(1) : 0
                },
                financial: {
                    today_revenue: todaySchedules.reduce((sum, s) => sum + Number(s.revenue || 0), 0),
                    monthly_revenue: ticketStats.total_revenue || 0,
                    monthly_fuel_cost: fuelStats.total_cost || 0,
                    monthly_maintenance_cost: maintenanceStats.total_cost || 0
                },
                charts: {
                    weekly_trips: await getWeeklyTripData(),
                    vehicle_utilization: await getVehicleUtilization(),
                    revenue_trend: await getRevenueTrend()
                },
                upcoming_schedules: upcomingSchedules.map(s => ({
                    schedule_id: s.schedule_id,
                    schedule_code: s.schedule_code,
                    route_name: s.route?.route_name,
                    departure_time: s.departure_time,
                    bus_registration: s.bus?.registration_number,
                    driver_name: s.driver ? `${s.driver.first_name} ${s.driver.last_name}` : null
                })),
                recent_activities: {
                    tickets: recentTickets.slice(0, 5),
                    fuel_logs: recentFuelLogs.slice(0, 3)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyTripData = async () => {
    const [result] = await sequelize.query(`
        SELECT
            DAYNAME(departure_time) as day,
            DAYOFWEEK(departure_time) as day_order,
            COUNT(*) as total_trips,
            SUM(CASE WHEN trip_status = 'completed' THEN 1 ELSE 0 END) as completed_trips
        FROM srmss_schedule
        WHERE departure_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DAYNAME(departure_time), DAYOFWEEK(departure_time)
        ORDER BY day_order
    `);

    return result;
};
const getVehicleUtilization = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            status,
            COUNT(*) as count,
            ROUND(COUNT(*) / (SELECT COUNT(*) FROM srmss_bus) * 100, 1) as percentage
        FROM srmss_bus
        GROUP BY status
    `);
    return result;
};

const getRevenueTrend = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            DATE(created_at) as date,
            SUM(fare_amount) as daily_revenue,
            COUNT(*) as ticket_count
        FROM srmss_ticket
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `);
    return result;
};

const getRoutePerformance = async (req, res, next) => {
    try {
        const [result] = await sequelize.query(`
            SELECT 
                r.route_id,
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
            WHERE s.departure_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY r.route_id
            ORDER BY total_revenue DESC
        `);

        res.json({
            success: true,
            message: "Route performance report retrieved successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getDriverPerformance = async (req, res, next) => {
    try {
        const [result] = await sequelize.query(`
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
            WHERE s.departure_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY d.driver_id
            ORDER BY rating DESC
        `);

        res.json({
            success: true,
            message: "Driver performance report retrieved successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getBusUtilizationReport = async (req, res, next) => {
    try {
        const [result] = await sequelize.query(`
            SELECT 
                b.bus_id,
                b.registration_number,
                b.bus_model,
                b.capacity,
                COUNT(s.schedule_id) as total_trips,
                SUM(s.passenger_count) as total_passengers,
                ROUND(AVG(s.passenger_count / b.capacity * 100), 1) as avg_occupancy,
                SUM(s.revenue) as total_revenue,
                SUM(f.fuel_amount) as total_fuel_liters,
                SUM(f.total_cost) as total_fuel_cost,
                ROUND(SUM(s.revenue) - SUM(f.total_cost), 2) as net_profit
            FROM srmss_bus b
            LEFT JOIN srmss_schedule s ON b.bus_id = s.bus_id
            LEFT JOIN srmss_fuel_log f ON b.bus_id = f.bus_id
            WHERE s.departure_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY b.bus_id
            ORDER BY net_profit DESC
        `);

        res.json({
            success: true,
            message: "Bus utilization report retrieved successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getRoutePerformance,
    getDriverPerformance,
    getBusUtilizationReport
};