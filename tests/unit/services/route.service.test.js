const RouteService = require("../../../src/services/route.service");
const routeRepository = require("../../../src/repositories/route.repository");
const mapsService = require("../../../src/services/maps.service");

jest.mock("../../../src/repositories/route.repository");
jest.mock("../../../src/services/maps.service");

describe("RouteService", () => {
    beforeEach(() => jest.clearAllMocks());

    // test("createRoute calculates distance", async () => {
    //     routeRepository.findByCode.mockResolvedValue(null);
    //     mapsService.calculateDistance.mockResolvedValue({ distanceKm: 100, durationMin: 90 });
    //     const data = { route_code: "R01", start_location: "A", end_location: "B" };
    //     const result = await RouteService.createRoute(data);
    //     expect(result.total_distance).toBe(100);
    //     expect(result.estimated_duration).toBe(90);
    // });

    test("createRoute throws if code exists", async () => {
        routeRepository.findByCode.mockResolvedValue({ route_id: 1 });
        await expect(RouteService.createRoute({ route_code: "R01" })).rejects.toThrow("Route code already exists");
    });
});