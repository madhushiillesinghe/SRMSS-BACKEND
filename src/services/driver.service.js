const driverRepository = require("../repositories/driver.repository");
const routeRepository = require("../repositories/route.repository");

class DriverService {
    static async getAllDrivers(filters) {
        return await driverRepository.findAll(filters);
    }

    static async getDriverById(id) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");
        return driver;
    }

    static async getDriverByCode(code) {
        const driver = await driverRepository.findByCode(code);
        if (!driver) throw new Error("Driver not found");
        return driver;
    }

    static async createDriver(data) {
        const existingLicense = await driverRepository.findByLicense(data.license_number);
        if (existingLicense) throw new Error("License number already exists");

        if (data.nic_number) {
            const existingNIC = await driverRepository.findByNIC(data.nic_number);
            if (existingNIC) throw new Error("NIC number already exists");
        }

        if (new Date(data.license_expiry) <= new Date()) {
            throw new Error("License expiry date must be in future");
        }

        return await driverRepository.create(data);
    }

    static async updateDriver(id, data) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        if (data.license_number && data.license_number !== driver.license_number) {
            const existing = await driverRepository.findByLicense(data.license_number);
            if (existing) throw new Error("License number already exists");
        }

        if (data.license_expiry && new Date(data.license_expiry) <= new Date()) {
            throw new Error("License expiry date must be in future");
        }

        return await driverRepository.update(id, data);
    }

    static async deleteDriver(id) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        return await driverRepository.deleteDriver(id);
    }

    static async getActiveDrivers() {
        return await driverRepository.getActiveDrivers();
    }

    static async getDriversOnDuty() {
        return await driverRepository.getDriversOnDuty();
    }

    static async getExpiringLicenses(days) {
        return await driverRepository.getExpiringLicenses(days || 30);
    }

    static async updateWorkingHours(id, hours) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        if (!driver.canTakeMoreHours(hours)) {
            throw new Error(`Driver cannot work more than ${driver.max_working_hours_per_day} hours per day`);
        }

        return await driverRepository.updateWorkingHours(id, hours);
    }

    static async resetDailyWorkingHours() {
        return await driverRepository.resetDailyWorkingHours();
    }

    static async updateRating(id, newRating) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        if (newRating < 0 || newRating > 5) {
            throw new Error("Rating must be between 0 and 5");
        }

        return await driverRepository.updateRating(id, newRating);
    }

    static async assignRoute(id, routeId) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        if (routeId) {
            const route = await routeRepository.findById(routeId);
            if (!route) throw new Error("Route not found");
        }

        return await driverRepository.update(id, { assigned_route_id: routeId });
    }

    static async getStatistics() {
        return await driverRepository.getStatistics();
    }

    static async getDriverWithSchedule(id) {
        const driver = await driverRepository.findById(id);
        if (!driver) throw new Error("Driver not found");

        const scheduleRepository = require("../repositories/schedule.repository");
        const upcomingSchedules = await scheduleRepository.findUpcomingSchedules(10);
        const driverSchedules = upcomingSchedules.filter(s => s.driver_id === parseInt(id));

        return {
            ...driver.toJSON(),
            upcoming_schedules: driverSchedules
        };
    }
}

module.exports = DriverService;