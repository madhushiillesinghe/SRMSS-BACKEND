const scheduleRepository = require("../repositories/schedule.repository");
const busRepository = require("../repositories/bus.repository");
const driverRepository = require("../repositories/driver.repository");
const routeRepository = require("../repositories/route.repository");

class ScheduleService {
    static async getAllSchedules(filters) {
        return await scheduleRepository.findAll(filters);
    }

    static async getScheduleById(id) {
        const schedule = await scheduleRepository.findById(id);
        if (!schedule) throw new Error("Schedule not found");
        return schedule;
    }

    static async getTodaySchedules() {
        return await scheduleRepository.findTodaySchedules();
    }

    static async getUpcomingSchedules(limit) {
        return await scheduleRepository.findUpcomingSchedules(limit);
    }

    static async createSchedule(data) {
        // Validate route exists
        const route = await routeRepository.findById(data.route_id);

        if (!route) throw new Error("Route not found");

        // Validate bus availability
        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");
        if (bus.status !== "available") throw new Error("Bus is not available");

        // Validate driver availability
        const driver = await driverRepository.findById(data.driver_id);
        if (!driver) throw new Error("Driver not found");
        if (driver.status !== "available") throw new Error("Driver is not available");
        if (!driver.isLicenseValid()) throw new Error("Driver license has expired");

        // Check for conflicts
        const conflicts = await scheduleRepository.checkConflicts(
            data.route_id, data.bus_id, data.driver_id,
            data.departure_time, data.arrival_time
        );

        if (conflicts.hasConflict) {
            const errors = [];
            if (conflicts.routeConflicts.length) errors.push("Route has conflicting schedule");
            if (conflicts.busConflicts.length) errors.push("Bus is already scheduled");
            if (conflicts.driverConflicts.length) errors.push("Driver is already scheduled");
            throw new Error(errors.join(", "));
        }

        return await scheduleRepository.create(data);
    }

    static async updateSchedule(id, data) {
        const schedule = await scheduleRepository.findById(id);
        if (!schedule) throw new Error("Schedule not found");

        // Check conflicts excluding current schedule
        if (data.departure_time || data.arrival_time || data.route_id || data.bus_id || data.driver_id) {
            const conflicts = await scheduleRepository.checkConflicts(
                data.route_id || schedule.route_id,
                data.bus_id || schedule.bus_id,
                data.driver_id || schedule.driver_id,
                data.departure_time || schedule.departure_time,
                data.arrival_time || schedule.arrival_time,
                id
            );

            if (conflicts.hasConflict) throw new Error("Schedule conflict detected");
        }

        return await scheduleRepository.update(id, data);
    }

    static async updateTripStatus(id, status, delayMinutes, delayReason) {
        const schedule = await scheduleRepository.findById(id);
        if (!schedule) throw new Error("Schedule not found");

        // Update bus and driver status based on trip status
        if (status === "in_progress") {
            await busRepository.update(schedule.bus_id, { status: "on_route" });
            await driverRepository.update(schedule.driver_id, { status: "on_duty" });
        } else if (status === "completed" || status === "cancelled") {
            await busRepository.update(schedule.bus_id, { status: "available" });
            await driverRepository.update(schedule.driver_id, { status: "available" });
        }

        return await scheduleRepository.updateTripStatus(id, status, delayMinutes, delayReason);
    }

    static async deleteSchedule(id) {
        const schedule = await scheduleRepository.findById(id);
        if (!schedule) throw new Error("Schedule not found");

        return await scheduleRepository.deleteSchedule(id);
    }

    static async getStatistics() {
        return await scheduleRepository.getStatistics();
    }

    static async getDailyReport(date) {
        return await scheduleRepository.getDailyReport(date);
    }
}

module.exports = ScheduleService;