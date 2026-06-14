const { BusLocation, Bus, Schedule, RouteStop, sequelize,Route } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.bus_id) where.bus_id = filters.bus_id;
    if (filters.schedule_id) where.schedule_id = filters.schedule_id;
    if (filters.status) where.status = filters.status;

    if (filters.from_date) {
        where.recorded_at = { [Op.gte]: filters.from_date };
    }
    if (filters.to_date) {
        where.recorded_at = { ...where.recorded_at, [Op.lte]: filters.to_date };
    }

    return await BusLocation.findAll({
        where,
        include: [
            { model: Bus, as: "Bus" },
            { model: Schedule, as: "Schedule" },
            // { model: RouteStop, as: "nextStop" }
        ],
        order: [["recorded_at", "DESC"]]
    });
};
BusLocation.findAll({
    where: {
        status: "active"
    },
    order: [["recorded_at", "DESC"]]
});
const findById = async (id) => {
    return await BusLocation.findByPk(id, {
        include: [
            { model: Bus, as: "Bus" },
            { model: Schedule, as: "Schedule" }
        ]
    });
};

const findLatestByBusId = async (busId) => {
    return await BusLocation.findOne({
        where: { bus_id: busId },
        include: [{ model: Bus, as: "Bus" }],
        order: [["recorded_at", "DESC"]]
    });
};
// src/repositories/busLocation.repository.js
// src/repositories/busLocation.repository.js

const getRouteProgressFromSchedule = async (busId, scheduleId) => {
    const schedule = await Schedule.findOne({
        where: { schedule_id: scheduleId, bus_id: busId },
        include: [{
            model: Route,
            as: 'Route',
            include: [{
                model: RouteStop,
                as: 'stops',
                order: [['stop_order', 'ASC']]
            }]
        }]
    });
    if (!schedule) return null;
    const route = schedule.Route;
    const stops = route.stops;
    if (!stops.length) return null;

    const currentStopId = schedule.current_stop_id;
    const nextStopId = schedule.next_stop_id;
    let currentStop = null, nextStop = null;
    if (currentStopId) currentStop = stops.find(s => s.stop_id === currentStopId);
    if (nextStopId) nextStop = stops.find(s => s.stop_id === nextStopId);
    if (!currentStop && !nextStop && stops.length) nextStop = stops[0];

    const distanceTraveled = currentStop ? currentStop.distance_from_start : 0;
    const totalDistance = route.total_distance;
    const progressPercentage = totalDistance > 0 ? (distanceTraveled / totalDistance) * 100 : 0;
    let estimatedMinutes = null;
    if (nextStop) {
        const distToNext = nextStop.distance_from_start - distanceTraveled;
        estimatedMinutes = (distToNext / 40) * 60; // rough 40 km/h
    }

    return {
        route: { route_id: route.route_id, total_distance: totalDistance, estimated_duration: route.estimated_duration },
        current_position: { latitude: null, longitude: null, distance_traveled: distanceTraveled, elapsed_time: 0, speed: 0, progress_percentage: progressPercentage },
        current_stop: currentStop ? { stop_id: currentStop.stop_id, stop_name: currentStop.stop_name, stop_order: currentStop.stop_order, distance_from_start: currentStop.distance_from_start, latitude: currentStop.latitude, longitude: currentStop.longitude } : null,
        next_stop: nextStop ? { stop_id: nextStop.stop_id, stop_name: nextStop.stop_name, distance_to_next: nextStop.distance_from_start - distanceTraveled, estimated_minutes: estimatedMinutes, latitude: nextStop.latitude, longitude: nextStop.longitude } : null,
        all_stops: stops.map(stop => ({ stop_id: stop.stop_id, stop_name: stop.stop_name, stop_order: stop.stop_order, distance_from_start: stop.distance_from_start, estimated_arrival_time: stop.estimated_arrival_time, is_passed: currentStop ? stop.stop_order <= currentStop.stop_order : false }))
    };
};

// The main endpoint will use only schedule data
const getBusRouteProgress = getRouteProgressFromSchedule; // direct alias

module.exports = {
    // ... other CRUD (findAll, create, etc. if needed)
    getBusRouteProgress,
    getRouteProgressFromSchedule
};