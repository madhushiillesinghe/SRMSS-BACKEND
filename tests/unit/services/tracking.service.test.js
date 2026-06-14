const TrackingService = require("../../../src/services/tracking.service");
const busRepository = require("../../../src/repositories/bus.repository");
const scheduleRepository = require("../../../src/repositories/schedule.repository");
const busLocationRepository = require("../../../src/repositories/busLocation.repository");

jest.mock("../../../src/repositories/bus.repository");
jest.mock("../../../src/repositories/schedule.repository");
jest.mock("../../../src/repositories/busLocation.repository");

describe("TrackingService (schedule‑only)", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getBusCurrentLocation returns location from schedule", async () => {
        busRepository.findById.mockResolvedValue({ bus_id: 1, registration_number: "B1" });
        scheduleRepository.findActiveScheduleByBus.mockResolvedValue({ schedule_id: 101 });
        busLocationRepository.getRouteProgressFromSchedule.mockResolvedValue({
            current_stop: { stop_name: "Stop A", latitude: "6.93", longitude: "79.86" },
            next_stop: { stop_name: "Stop B", estimated_minutes: 30 },
        });
        const result = await TrackingService.getBusCurrentLocation(1);
        expect(result.bus.registration_number).toBe("B1");
        expect(result.location.latitude).toBe("6.93");
        expect(result.next_stop_eta.etaMinutes).toBe(30);
        expect(result.route_progress).toBeDefined();
    });

    test("getBusCurrentLocation throws if no active schedule", async () => {
        busRepository.findById.mockResolvedValue({ bus_id: 1 });
        scheduleRepository.findActiveScheduleByBus.mockResolvedValue(null);
        await expect(TrackingService.getBusCurrentLocation(1)).rejects.toThrow("No active schedule found");
    });

    test("getActiveBusesWithScheduleProgress returns list", async () => {
        busRepository.findAllActive.mockResolvedValue([{ bus_id: 1, registration_number: "B1" }]);
        scheduleRepository.findActiveScheduleByBus.mockResolvedValue({ schedule_id: 1, Route: { stops: [] } });
        const result = await TrackingService.getActiveBusesWithScheduleProgress();
        expect(result[0].bus.bus_id).toBe(1);
        expect(result[0].schedule).toBeDefined();
    });
});