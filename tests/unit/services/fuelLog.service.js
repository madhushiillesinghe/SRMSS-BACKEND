const FuelLogService = require("../../../src/services/fuelLog.service");
const fuelLogRepository = require("../../../src/repositories/fuelLog.repository");
const busRepository = require("../../../src/repositories/bus.repository");

jest.mock("../../../src/repositories/fuelLog.repository");
jest.mock("../../../src/repositories/bus.repository");

describe("FuelLogService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getAllLogs returns list", async () => {
        const mockLogs = [{ log_id: 1, bus_id: 1, fuel_amount: 50 }];
        fuelLogRepository.findAll.mockResolvedValue(mockLogs);
        const result = await FuelLogService.getAllLogs({ bus_id: 1 });
        expect(result).toEqual(mockLogs);
        expect(fuelLogRepository.findAll).toHaveBeenCalledWith({ bus_id: 1 });
    });

    test("getLogById returns log", async () => {
        const mockLog = { log_id: 1, fuel_amount: 50 };
        fuelLogRepository.findById.mockResolvedValue(mockLog);
        const result = await FuelLogService.getLogById(1);
        expect(result).toEqual(mockLog);
    });

    test("getLogById throws if not found", async () => {
        fuelLogRepository.findById.mockResolvedValue(null);
        await expect(FuelLogService.getLogById(99)).rejects.toThrow("Fuel log not found");
    });

    test("createLog creates and updates bus odometer", async () => {
        const mockBus = { bus_id: 1, current_odometer: 10000 };
        busRepository.findById.mockResolvedValue(mockBus);
        const mockLog = { log_id: 1, odometer_reading: 10500 };
        fuelLogRepository.create.mockResolvedValue(mockLog);
        busRepository.updateBusOdometer.mockResolvedValue({ ...mockBus, current_odometer: 10500 });

        const data = { bus_id: 1, odometer_reading: 10500, fuel_amount: 50, cost_per_liter: 2 };
        const result = await FuelLogService.createLog(data);
        expect(result).toEqual(mockLog);
        expect(busRepository.updateBusOdometer).toHaveBeenCalledWith(1, 10500);
    });

    test("updateLog updates existing log", async () => {
        const existingLog = { log_id: 1, fuel_amount: 50 };
        fuelLogRepository.findById.mockResolvedValue(existingLog);
        fuelLogRepository.update.mockResolvedValue({ ...existingLog, fuel_amount: 60 });
        const result = await FuelLogService.updateLog(1, { fuel_amount: 60 });
        expect(result.fuel_amount).toBe(60);
    });

    test("deleteLog removes log", async () => {
        fuelLogRepository.findById.mockResolvedValue({ log_id: 1 });
        fuelLogRepository.deleteLog.mockResolvedValue(true);
        const result = await FuelLogService.deleteLog(1);
        expect(result).toBe(true);
    });

    test("getBusHistory returns history", async () => {
        const mockHistory = [{ fuel_date: "2024-01-01", fuel_amount: 50 }];
        fuelLogRepository.getBusFuelHistory.mockResolvedValue(mockHistory);
        const result = await FuelLogService.getBusHistory(1, 30);
        expect(result).toEqual(mockHistory);
    });

    test("getStatistics returns stats", async () => {
        const mockStats = { total_fuel_liters: 500, total_cost: 1000 };
        fuelLogRepository.getStatistics.mockResolvedValue(mockStats);
        const result = await FuelLogService.getStatistics(1, 30);
        expect(result).toEqual(mockStats);
    });

    test("getFuelEfficiency returns efficiency data", async () => {
        const mockEfficiency = [{ efficiency: 12.5 }];
        fuelLogRepository.getFuelEfficiency.mockResolvedValue(mockEfficiency);
        const result = await FuelLogService.getFuelEfficiency(1, 30);
        expect(result).toEqual(mockEfficiency);
    });
});