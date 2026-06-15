const driverRepository = require("../repositories/driver.repository");
const routeRepository = require("../repositories/route.repository");
const scheduleRepository = require("../repositories/schedule.repository");


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
    static async loginDriver(email, nicNumber) {
        const driver = await driverRepository.findByEmailAndNIC(email, nicNumber);
        if (!driver) throw new Error("Invalid email or NIC number");
        if (driver.status !== "available") throw new Error("Driver account is not available");
        // Update last login? (optional, add a field to Driver model if needed)
        return driver;
    }
    static generateToken(driver) {
        return jwt.sign(
            { id: driver.driver_id, role: "driver", type: "access" },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );
    }

    static async getActiveSchedule(driverId) {
        const schedule = await scheduleRepository.findActiveScheduleByDriver(driverId);
        console.log(schedule,"scehdule in")
        if (!schedule) throw new Error("No active schedule found");
        return schedule;
    }
    static async markArrival(scheduleId, stopId) {
        const schedule = await scheduleRepository.findById(scheduleId);
        if (!schedule) throw new Error("Schedule not found");

        const route = schedule.Route;
        if (!route || !route.stops) throw new Error("Route stops not defined");

        const stops = route.stops.sort((a,b) => a.stop_order - b.stop_order);
        const currentIndex = stops.findIndex(s => s.stop_id === stopId);
        if (currentIndex === -1) throw new Error("Stop not found in route");

        const nextStop = stops[currentIndex + 1] || null;
        await scheduleRepository.updateScheduleStops(scheduleId, stopId, nextStop?.stop_id || null);
        return { scheduleId, currentStopId: stopId, nextStopId: nextStop?.stop_id || null };
    }
}

module.exports = DriverService;