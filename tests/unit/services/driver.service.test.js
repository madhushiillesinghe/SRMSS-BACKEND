const DriverService = require("../../../src/services/driver.service");
const driverRepository = require("../../../src/repositories/driver.repository");

jest.mock("../../../src/repositories/driver.repository");

describe("DriverService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("getAllDrivers returns list", async () => {
        driverRepository.findAll.mockResolvedValue([{ driver_id: 1 }]);
        const result = await DriverService.getAllDrivers({});
        expect(result).toHaveLength(1);
    });

    test("createDriver throws if license exists", async () => {
        driverRepository.findByLicense.mockResolvedValue({ driver_id: 1 });
        await expect(DriverService.createDriver({ license_number: "L123" })).rejects.toThrow("License number already exists");
    });

});