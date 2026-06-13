// src/services/schedule.service.js
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
        const route = await routeRepository.findById(data.route_id);
        if (!route) throw new Error("Route not found");

        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");
        if (bus.status !== "available") throw new Error("Bus is not available");

        const driver = await driverRepository.findById(data.driver_id);
        if (!driver) throw new Error("Driver not found");
        if (driver.status !== "available") throw new Error("Driver is not available");

        // Check for conflicts
        const conflicts = await scheduleRepository.checkConflicts(
            data.route_id, data.bus_id, data.driver_id,
            data.departure_time, data.arrival_time
        );

        // if (conflicts.hasConflict) {
        //     const errors = [];
        //     if (conflicts.routeConflicts.length) errors.push("Route has conflicting schedule");
        //     if (conflicts.busConflicts.length) errors.push("Bus is already scheduled");
        //     if (conflicts.driverConflicts.length) errors.push("Driver is already scheduled");
        //     throw new Error(errors.join(", "));
        // }

        return await scheduleRepository.create(data);
    }

    // Create Daily Schedule with Multiple Trips (Morning, Afternoon, Evening)
    static async createMultiTripSchedule(data) {
        const { routeId, busId, driverId, tripTimes, tripType } = data;
        // tripTimes: [{ time: "09:30", type: "regular" }, { time: "13:30", type: "express" }, { time: "16:30", type: "regular" }]

        const route = await routeRepository.findById(routeId);
        if (!route) throw new Error("Route not found");

        const bus = await busRepository.findById(busId);
        if (!bus) throw new Error("Bus not found");

        const driver = await driverRepository.findById(driverId);
        if (!driver) throw new Error("Driver not found");

        const schedules = [];
        const errors = [];

        // Sort trip times by time
        const sortedTrips = [...tripTimes].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        for (const trip of sortedTrips) {
            try {
                const departureTime = new Date(trip.time);
                const arrivalTime = new Date(departureTime.getTime() + route.estimated_duration * 60000);

                const newSchedule = await this.createSchedule({
                    route_id: routeId,
                    bus_id: busId,
                    driver_id: driverId,
                    departure_time: departureTime,
                    arrival_time: arrivalTime,
                    trip_type: trip.type || tripType || "regular"
                });
                schedules.push(newSchedule);

                console.log(`✅ Schedule created for ${departureTime.toLocaleTimeString()}`);
            } catch (error) {
                errors.push({
                    time: trip.time,
                    error: error.message
                });
                console.log(`❌ Failed to create schedule for ${trip.time}: ${error.message}`);
            }
        }

        return {
            success: schedules.length > 0,
            created: schedules,
            failed: errors,
            totalCreated: schedules.length,
            totalFailed: errors.length
        };
    }

    // Create Daily Schedule with Morning & Evening (2 trips)
    static async createDailySchedule(data) {
        const { routeId, busId, driverId, morningTime, eveningTime, tripType } = data;

        const route = await routeRepository.findById(routeId);
        if (!route) throw new Error("Route not found");

        const bus = await busRepository.findById(busId);
        if (!bus) throw new Error("Bus not found");

        const driver = await driverRepository.findById(driverId);
        if (!driver) throw new Error("Driver not found");

        const schedules = [];

        // Morning Schedule
        const morningDeparture = new Date(morningTime);
        const morningArrival = new Date(morningDeparture.getTime() + route.estimated_duration * 60000);

        const morningSchedule = await this.createSchedule({
            route_id: routeId,
            bus_id: busId,
            driver_id: driverId,
            departure_time: morningDeparture,
            arrival_time: morningArrival,
            trip_type: tripType || "regular"
        });
        schedules.push(morningSchedule);

        // Evening Schedule (Return Journey)
        const eveningDeparture = new Date(eveningTime);
        const eveningArrival = new Date(eveningDeparture.getTime() + route.estimated_duration * 60000);

        const eveningSchedule = await this.createSchedule({
            route_id: routeId,
            bus_id: busId,
            driver_id: driverId,
            departure_time: eveningDeparture,
            arrival_time: eveningArrival,
            trip_type: tripType || "regular"
        });
        schedules.push(eveningSchedule);

        return schedules;
    }

    // ✅ Create Weekly Schedule Template
    static async createWeeklySchedule(data) {
        const { routeId, busId, driverId, weekStartDate, tripTimes, tripType } = data;

        const schedules = [];
        const weekStart = new Date(weekStartDate);
        const errors = [];

        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + day);
            const dateStr = currentDate.toISOString().split('T')[0];

            for (const trip of tripTimes) {
                const departureDateTime = new Date(`${dateStr}T${trip.time}`);

                // Skip if departure time is in the past for today
                if (day === 0 && departureDateTime < new Date()) {
                    errors.push({
                        day: day + 1,
                        time: trip.time,
                        error: "Departure time is in the past"
                    });
                    continue;
                }

                try {
                    const schedule = await this.createSchedule({
                        route_id: routeId,
                        bus_id: busId,
                        driver_id: driverId,
                        departure_time: departureDateTime,
                        trip_type: trip.type || tripType || "regular"
                    });
                    schedules.push(schedule);
                } catch (error) {
                    errors.push({
                        day: day + 1,
                        time: trip.time,
                        error: error.message
                    });
                }
            }
        }

        return {
            success: schedules.length > 0,
            created: schedules,
            failed: errors,
            totalCreated: schedules.length,
            totalFailed: errors.length
        };
    }

    // ✅ Get All Schedules for a Bus on a Specific Date
    static async getBusSchedulesForDate(busId, date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return await scheduleRepository.findAll({
            bus_id: busId,
            from_date: startDate,
            to_date: endDate
        });
    }

    // ✅ Get Bus Daily Schedule (All trips for a bus)
    static async getBusDailySchedule(busId, date) {
        const schedules = await this.getBusSchedulesForDate(busId, date);

        const bus = await busRepository.findById(busId);

        return {
            bus: {
                id: bus.bus_id,
                registration_number: bus.registration_number,
                bus_model: bus.bus_model,
                capacity: bus.capacity
            },
            date: date,
            totalTrips: schedules.length,
            trips: schedules.map(s => ({
                schedule_id: s.schedule_id,
                schedule_code: s.schedule_code,
                departure_time: s.departure_time,
                arrival_time: s.arrival_time,
                route: s.Route?.route_name,
                trip_type: s.trip_type,
                status: s.trip_status,
                driver: s.Driver ? `${s.Driver.first_name} ${s.Driver.last_name}` : null
            }))
        };
    }

    static async updateSchedule(id, data) {
        const schedule = await scheduleRepository.findById(id);
        if (!schedule) throw new Error("Schedule not found");

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

        if (status === "in_progress") {
            await busRepository.update(schedule.bus_id, { status: "on_route" });
            await driverRepository.update(schedule.driver_id, { status: "on_duty" });
        } else if (status === "completed" || status === "cancelled") {
            // Check if bus has any other active schedules
            const otherActiveSchedules = await scheduleRepository.findAll({
                bus_id: schedule.bus_id,
                status: ["in_progress", "scheduled", "on_time", "delayed"]
            });

            if (otherActiveSchedules.length <= 1) {
                await busRepository.update(schedule.bus_id, { status: "available" });
                await driverRepository.update(schedule.driver_id, { status: "available" });
            }
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

    // ✅ Get Weekly Schedule Summary
    static async getWeeklyScheduleSummary(startDate, endDate) {
        const schedules = await scheduleRepository.findAll({
            from_date: startDate,
            to_date: endDate
        });

        const dailySummary = {};

        schedules.forEach(schedule => {
            const date = schedule.departure_time.toISOString().split('T')[0];
            if (!dailySummary[date]) {
                dailySummary[date] = {
                    date: date,
                    totalTrips: 0,
                    completed: 0,
                    delayed: 0,
                    onTime: 0,
                    cancelled: 0
                };
            }

            dailySummary[date].totalTrips++;

            switch(schedule.trip_status) {
                case "completed": dailySummary[date].completed++; break;
                case "delayed": dailySummary[date].delayed++; break;
                case "on_time": dailySummary[date].onTime++; break;
                case "cancelled": dailySummary[date].cancelled++; break;
            }
        });

        return Object.values(dailySummary);
    }
}

module.exports = ScheduleService;