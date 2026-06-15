const ReportService = require("../../../src/services/report.service");
const fuelLogRepository = require("../../../src/repositories/fuelLog.repository");
const maintenanceRepository = require("../../../src/repositories/maintenance.repository");
const ticketRepository = require("../../../src/repositories/ticket.repository");
const scheduleRepository = require("../../../src/repositories/schedule.repository");
const busRepository = require("../../../src/repositories/bus.repository");
const driverRepository = require("../../../src/repositories/driver.repository");

jest.mock("../../../src/repositories/fuelLog.repository");
jest.mock("../../../src/repositories/maintenance.repository");
jest.mock("../../../src/repositories/ticket.repository");
jest.mock("../../../src/repositories/schedule.repository");
jest.mock("../../../src/repositories/bus.repository");
jest.mock("../../../src/repositories/driver.repository");

describe("ReportService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getFuelReport returns correct structure", async () => {
        const mockFuelLogs = [
            { fuel_date: "2024-01-01", fuel_amount: 100, total_cost: 200, fuel_type: "Diesel" }
        ];
        fuelLogRepository.findAll.mockResolvedValue(mockFuelLogs);
        const result = await ReportService.getFuelReport(1, "2024-01-01", "2024-01-31");
        expect(result.reportType).toBe("Fuel Consumption Report");
        expect(result.summary.totalFuelLiters).toBe("100.00");
        expect(result.summary.totalCost).toBe("200.00");
        expect(result.details).toHaveLength(1);
    });

    test("getMaintenanceReport returns correct structure", async () => {
        const mockLogs = [
            { maintenance_date: "2024-01-01", maintenance_type: "routine", cost: 500, maintenance_category: "engine" }
        ];
        maintenanceRepository.findAll.mockResolvedValue(mockLogs);
        maintenanceRepository.getUpcomingMaintenance.mockResolvedValue([]);
        const result = await ReportService.getMaintenanceReport(1, "2024-01-01", "2024-01-31");
        expect(result.reportType).toBe("Maintenance Report");
        expect(result.summary.totalMaintenanceJobs).toBe(1);
        expect(result.summary.totalCost).toBe("500.00");
    });

    test("getRevenueReport returns correct structure", async () => {
        const mockTickets = [
            { travel_date: "2024-01-01", booking_status: "used", fare_amount: 100, payment_method: "cash" }
        ];
        ticketRepository.findAll.mockResolvedValue(mockTickets);
        // Mock sequelize query for top routes – we'll just return empty array
        const { sequelize } = require("../../../src/models");
        sequelize.query = jest.fn().mockResolvedValue([[]]);

        const result = await ReportService.getRevenueReport("2024-01-01", "2024-01-31");
        expect(result.reportType).toBe("Revenue Report");
        expect(result.summary.totalTicketsSold).toBe(1);
        expect(result.summary.totalRevenue).toBe("100.00");
    });

    test("getOperationalReport returns correct structure", async () => {
        const mockSchedules = [
            { schedule_id: 1, trip_status: "completed", passenger_count: 30, revenue: 300 }
        ];
        scheduleRepository.findAll.mockResolvedValue(mockSchedules);
        // Mock sequelize queries
        const { sequelize } = require("../../../src/models");
        sequelize.query.mockImplementation((sql, options) => {
            if (sql.includes("route_performance")) return Promise.resolve([[]]);
            if (sql.includes("driver_performance")) return Promise.resolve([[]]);
            if (sql.includes("bus_utilization")) return Promise.resolve([[]]);
            return Promise.resolve([[]]);
        });

        const result = await ReportService.getOperationalReport("2024-01-01", "2024-01-31");
        expect(result.reportType).toBe("Operational Performance Report");
        expect(result.summary.completedTrips).toBe(1);
        expect(result.summary.totalPassengers).toBe(30);
    });

    test("getFleetUtilizationReport returns correct structure", async () => {
        busRepository.getStatistics.mockResolvedValue({ total_buses: 10, available: 5, on_route: 3, maintenance: 2 });
        driverRepository.getStatistics.mockResolvedValue({ total_drivers: 20, available: 15, on_duty: 5 });
        const { sequelize } = require("../../../src/models");
        sequelize.query
            .mockResolvedValueOnce([[{ bus_type: "AC", count: 3 }]])   // buses by type
            .mockResolvedValueOnce([[{ fuel_type: "Diesel", count: 8 }]]) // buses by fuel
            .mockResolvedValueOnce([[{ maintenance_type: "routine", count: 2, total_cost: 1000 }]]); // maintenance summary
        const result = await ReportService.getFleetUtilizationReport();
        expect(result.reportType).toBe("Fleet Utilization Report");
        expect(result.summary.totalBuses).toBe(10);
        expect(result.summary.utilizationRate).toBe("50.00");
    });
});