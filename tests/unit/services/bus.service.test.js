const BusService = require("../../../src/services/bus.service");
const busRepository = require("../../../src/repositories/bus.repository");

jest.mock("../../../src/repositories/bus.repository");

describe("BusService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getAllBuses", () => {
        it("should return list of buses", async () => {
            const mockBuses = [{ bus_id: 1, registration_number: "AB-123" }];
            busRepository.findAll.mockResolvedValue(mockBuses);
            const result = await BusService.getAllBuses({ status: "active" });
            expect(result).toEqual(mockBuses);
            expect(busRepository.findAll).toHaveBeenCalledWith({ status: "active" });
        });
    });

    describe("createBus", () => {
        it("should throw if registration number exists", async () => {
            busRepository.findByRegistration.mockResolvedValue({ bus_id: 1 });
            await expect(BusService.createBus({ registration_number: "AB-123" })).rejects.toThrow("Registration number already exists");
        });

        it("should create bus successfully", async () => {
            busRepository.findByRegistration.mockResolvedValue(null);
            busRepository.create.mockResolvedValue({ bus_id: 2, registration_number: "AB-123" });
            const result = await BusService.createBus({ registration_number: "AB-123" });
            expect(result.bus_id).toBe(2);
        });
    });

});