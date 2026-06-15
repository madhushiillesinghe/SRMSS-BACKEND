const ScheduleService = require("../../../src/services/schedule.service");
const scheduleRepository = require("../../../src/repositories/schedule.repository");
const busRepository = require("../../../src/repositories/bus.repository");
const driverRepository = require("../../../src/repositories/driver.repository");
const routeRepository = require("../../../src/repositories/route.repository");

jest.mock("../../../src/repositories/schedule.repository");
jest.mock("../../../src/repositories/bus.repository");
jest.mock("../../../src/repositories/driver.repository");
jest.mock("../../../src/repositories/route.repository");

describe("ScheduleService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getAllSchedules returns list", async () => {
        scheduleRepository.findAll.mockResolvedValue([{ schedule_id: 1 }]);
        const result = await ScheduleService.getAllSchedules({});
        expect(result).toHaveLength(1);
    });

    test("createSchedule validates bus/driver", async () => {
        routeRepository.findById.mockResolvedValue({ route_id: 1 });
        busRepository.findById.mockResolvedValue({ bus_id: 1, status: "available" });
        driverRepository.findById.mockResolvedValue({ driver_id: 1, status: "available" });
        scheduleRepository.checkConflicts.mockResolvedValue({ hasConflict: false });
        scheduleRepository.create.mockResolvedValue({ schedule_id: 1 });
        const data = { route_id: 1, bus_id: 1, driver_id: 1, departure_time: new Date(), arrival_time: new Date() };
        const result = await ScheduleService.createSchedule(data);
        expect(result.schedule_id).toBe(1);
    });

    test("createSchedule throws if bus not available", async () => {
        routeRepository.findById.mockResolvedValue({ route_id: 1 });
        busRepository.findById.mockResolvedValue({ status: "maintenance" });
        await expect(ScheduleService.createSchedule({ bus_id: 1 })).rejects.toThrow("Bus is not available");
    });
});