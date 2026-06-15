const MapsService = require("../../../src/services/maps.service");
const axios = require("axios");

jest.mock("axios");

describe("MapsService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getCoordinates returns lat/lng from ORS", async () => {
        axios.get.mockResolvedValue({
            data: {
                features: [{ geometry: { coordinates: [79.8612, 6.9271] } }]
            }
        });
        const result = await MapsService.getCoordinates("Colombo");
        expect(result).toEqual({ lng: 79.8612, lat: 6.9271 });
        expect(axios.get).toHaveBeenCalledWith(
            "https://api.openrouteservice.org/geocode/search",
            expect.objectContaining({
                params: expect.objectContaining({ text: "Colombo", size: 1 })
            })
        );
    });

    test("getCoordinates throws if location not found", async () => {
        axios.get.mockResolvedValue({ data: { features: [] } });
        await expect(MapsService.getCoordinates("Nowhere")).rejects.toThrow("Location not found: Nowhere");
    });

    test("calculateDistance returns distance and duration", async () => {
        // Mock geocode calls (two calls)
        axios.get
            .mockResolvedValueOnce({ data: { features: [{ geometry: { coordinates: [79.8612, 6.9271] } }] } })
            .mockResolvedValueOnce({ data: { features: [{ geometry: { coordinates: [80.6337, 7.2906] } }] } });
        axios.post.mockResolvedValue({
            data: { routes: [{ summary: { distance: 118500, duration: 10800 } }] }
        });
        const result = await MapsService.calculateDistance("Colombo", "Kandy");
        expect(result.distanceKm).toBe(118.5);
        expect(result.durationMin).toBe(180);
    });
});