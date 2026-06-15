// tests/unit/controllers/tracking.controller.test.js
const trackingController = require("../../../src/controllers/tracking.controller");

jest.mock("../../../src/services/tracking.service", () => ({
    getBusCurrentLocation: jest.fn(),
    getAllActiveBusesLocations: jest.fn(),
    getBusRouteProgress: jest.fn(),
    getBusHistory: jest.fn(),
    getBusLocationStats: jest.fn(),
    driverArrivedAtStop: jest.fn(),
    getActiveBusesWithScheduleProgress: jest.fn(),
    updateBusLocation: jest.fn(),
}));

const TrackingService = require("../../../src/services/tracking.service");

describe("TrackingController", () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {}, body: {}, query: {} };
        res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    test("getBusCurrentLocation returns data", async () => {
        req.params = { busId: "1" };
        const mockData = { bus: { id: 1 }, location: { latitude: 6.93, longitude: 79.86 } };
        TrackingService.getBusCurrentLocation.mockResolvedValue(mockData);

        await trackingController.getBusCurrentLocation(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Bus current location retrieved successfully",
            data: mockData,
        });
        expect(TrackingService.getBusCurrentLocation).toHaveBeenCalledWith("1");
    });

    test("getBusCurrentLocation handles 404 when no active schedule", async () => {
        req.params = { busId: "1" };
        const error = new Error("No active schedule found for this bus");
        TrackingService.getBusCurrentLocation.mockRejectedValue(error);

        await trackingController.getBusCurrentLocation(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "No active schedule found for this bus",
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("getBusCurrentLocation passes other errors to next", async () => {
        req.params = { busId: "1" };
        const error = new Error("Database connection failed");
        TrackingService.getBusCurrentLocation.mockRejectedValue(error);

        await trackingController.getBusCurrentLocation(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
    });
});