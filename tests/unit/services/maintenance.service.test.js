const MaintenanceService = require("../../../src/services/maintenance.service");
const maintenanceRepository = require("../../../src/repositories/maintenance.repository");
const busRepository = require("../../../src/repositories/bus.repository");

jest.mock("../../../src/repositories/maintenance.repository");
jest.mock("../../../src/repositories/bus.repository");

describe("MaintenanceService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getAllLogs returns list", async () => {
        const mockLogs = [{ log_id: 1, bus_id: 1, cost: 500 }];
        maintenanceRepository.findAll.mockResolvedValue(mockLogs);
        const result = await MaintenanceService.getAllLogs({ bus_id: 1 });
        expect(result).toEqual(mockLogs);
    });

    test("getLogById returns log", async () => {
        const mockLog = { log_id: 1, description: "Oil change" };
        maintenanceRepository.findById.mockResolvedValue(mockLog);
        const result = await MaintenanceService.getLogById(1);
        expect(result).toEqual(mockLog);
    });

    test("getLogById throws if not found", async () => {
        maintenanceRepository.findById.mockResolvedValue(null);
        await expect(MaintenanceService.getLogById(99)).rejects.toThrow("Maintenance log not found");
    });

    test("createLog creates and updates bus status", async () => {
        const mockBus = { bus_id: 1, status: "available" };
        busRepository.findById.mockResolvedValue(mockBus);
        const mockLog = { log_id: 1, maintenance_type: "emergency" };
        maintenanceRepository.create.mockResolvedValue(mockLog);
        busRepository.update.mockResolvedValue({ ...mockBus, status: "maintenance" });

        const data = { bus_id: 1, maintenance_type: "emergency", description: "Engine failure" };
        const result = await MaintenanceService.createLog(data);
        expect(result).toEqual(mockLog);
        expect(busRepository.update).toHaveBeenCalledWith(1, { status: "maintenance" });
    });

    test("completeMaintenance completes and updates bus status", async () => {
        const mockLog = { log_id: 1, bus_id: 1 };
        maintenanceRepository.findById.mockResolvedValue(mockLog);
        maintenanceRepository.completeMaintenance.mockResolvedValue({ ...mockLog, status: "completed" });
        busRepository.update.mockResolvedValue({});

        const result = await MaintenanceService.completeMaintenance(1, "admin");
        expect(maintenanceRepository.completeMaintenance).toHaveBeenCalledWith(1, "admin");
        expect(busRepository.update).toHaveBeenCalledWith(1, { status: "available" });
    });

    test("getUpcoming returns upcoming maintenance", async () => {
        const mockUpcoming = [{ next_due_date: "2024-12-01" }];
        maintenanceRepository.getUpcomingMaintenance.mockResolvedValue(mockUpcoming);
        const result = await MaintenanceService.getUpcoming(7);
        expect(result).toEqual(mockUpcoming);
    });

    test("getBusHistory returns history", async () => {
        const mockHistory = [{ maintenance_date: "2024-01-01" }];
        maintenanceRepository.getBusMaintenanceHistory.mockResolvedValue(mockHistory);
        const result = await MaintenanceService.getBusHistory(1);
        expect(result).toEqual(mockHistory);
    });

    test("getStatistics returns stats", async () => {
        const mockStats = { total_maintenance: 10, total_cost: 5000 };
        maintenanceRepository.getStatistics.mockResolvedValue(mockStats);
        const result = await MaintenanceService.getStatistics(1, 30);
        expect(result).toEqual(mockStats);
    });
});