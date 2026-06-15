const { Schedule, Route, Bus, Driver, Ticket, sequelize, RouteStop } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.trip_status = filters.status;
    if (filters.route_id) where.route_id = filters.route_id;
    if (filters.bus_id) where.bus_id = filters.bus_id;
    if (filters.driver_id) where.driver_id = filters.driver_id;

    if (filters.from_date) {
        where.departure_time = { [Op.gte]: new Date(filters.from_date) };
    }
    if (filters.to_date) {
        where.departure_time = { ...where.departure_time, [Op.lte]: new Date(filters.to_date) };
    }

    return await Schedule.findAll({
        where,
        include: [
            { model: Route },
            { model: Bus },
            { model: Driver },
            { model: Ticket, as: "tickets" }
        ],
        order: [["departure_time", "ASC"]]
    });
};

const findById = async (id) => {
    return await Schedule.findByPk(id, {
        include: [
            {
                model: Route,
                include: [{
                    model: RouteStop,
                    as: "stops"
                }]
            },
            { model: Bus },
            { model: Driver },
            { model: Ticket, as: "tickets" }
        ]
    });
};

const findByCode = async (code) => {
    return await Schedule.findOne({ where: { schedule_code: code } });
};

const findTodaySchedules = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await Schedule.findAll({
        where: {
            departure_time: { [Op.between]: [today, tomorrow] }
        },
        include: [
            { model: Route, as: "Route" },
            { model: Bus, as: "Bus" },
            { model: Driver, as: "Driver" }
        ],
        order: [["departure_time", "ASC"]]
    });
};

const findUpcomingSchedules = async (limit = 10) => {
    return await Schedule.findAll({
        where: {
            departure_time: { [Op.gt]: new Date() },
            trip_status: { [Op.notIn]: ["completed", "cancelled"] }
        },
        include: [
            { model: Route, as: "Route" },
            { model: Bus, as: "Bus" },
            { model: Driver, as: "Driver" }
        ],
        order: [["departure_time", "ASC"]],
        limit
    });
};

const create = async (data) => {
    if (!data.schedule_code) {
        const date = new Date();
        const prefix = `SCH${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = await Schedule.count();
        data.schedule_code = `${prefix}${String(count + 1).padStart(4, '0')}`;
    }
    return await Schedule.create(data);
};

const update = async (id, data) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;
    return await schedule.update(data);
};

const updateTripStatus = async (id, status, delayMinutes = 0, delayReason = null) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;

    const updateData = { trip_status: status };
    if (status === "delayed") {
        updateData.delay_minutes = delayMinutes;
        updateData.delay_reason = delayReason;
    }
    if (status === "in_progress") {
        updateData.actual_departure = new Date();
    }
    if (status === "completed") {
        updateData.actual_arrival = new Date();
    }

    return await schedule.update(updateData);
};

const deleteSchedule = async (id) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;
    await schedule.update({ trip_status: "cancelled" });
    return schedule;
};

const checkConflicts = async (routeId, busId, driverId, departureTime, arrivalTime, excludeId = null) => {
    const where = {
        [Op.or]: [
            { departure_time: { [Op.between]: [departureTime, arrivalTime] } },
            { arrival_time: { [Op.between]: [departureTime, arrivalTime] } },
            {
                [Op.and]: [
                    { departure_time: { [Op.lte]: departureTime } },
                    { arrival_time: { [Op.gte]: arrivalTime } }
                ]
            }
        ],
        trip_status: { [Op.notIn]: ["completed", "cancelled"] }
    };

    if (excludeId) {
        where.schedule_id = { [Op.ne]: excludeId };
    }

    const [routeConflicts, busConflicts, driverConflicts] = await Promise.all([
        Schedule.findAll({ where: { ...where, route_id: routeId } }),
        Schedule.findAll({ where: { ...where, bus_id: busId } }),
        Schedule.findAll({ where: { ...where, driver_id: driverId } })
    ]);

    return {
        hasConflict: routeConflicts.length > 0 || busConflicts.length > 0 || driverConflicts.length > 0,
        routeConflicts,
        busConflicts,
        driverConflicts
    };
};

const getStatistics = async () => {
    try {
        const [result] = await sequelize.query(`
            SELECT COUNT(*)                                                     as total_schedules,
                   SUM(CASE WHEN trip_status = 'completed' THEN 1 ELSE 0 END)   as completed,
                   SUM(CASE WHEN trip_status = 'delayed' THEN 1 ELSE 0 END)     as \`delayed\`,
                   SUM(CASE WHEN trip_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                   SUM(CASE WHEN trip_status = 'scheduled' THEN 1 ELSE 0 END)   as scheduled,
                   SUM(CASE WHEN trip_status = 'cancelled' THEN 1 ELSE 0 END)   as cancelled,
                   SUM(passenger_count)                                         as total_passengers,
                   SUM(revenue)                                                 as total_revenue,
                   AVG(passenger_count)                                         as avg_passengers_per_trip,
                   AVG(revenue)                                                 as avg_revenue_per_trip
            FROM srmss_schedule
            WHERE DATE(departure_time) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);
        return result[0];
    } catch (error) {
        console.error("Error in getStatistics:", error.message);
        return {
            total_schedules: 0,
            completed: 0,
            delayed: 0,
            in_progress: 0,
            scheduled: 0,
            cancelled: 0,
            total_passengers: 0,
            total_revenue: 0,
            avg_passengers_per_trip: 0,
            avg_revenue_per_trip: 0
        };
    }
};

const updateCurrentAndNextStop = async (scheduleId, currentStopId, nextStopId) => {
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) return null;
    return await schedule.update({
        current_stop_id: currentStopId,
        next_stop_id: nextStopId
    });
};

const getScheduleWithRouteStops = async (scheduleId) => {
    return await Schedule.findByPk(scheduleId, {
        include: [
            {
                model: Route,
                as: 'Route',
                include: [{
                    model: RouteStop,
                    as: 'stops',
                    order: [['stop_order', 'ASC']]
                }]
            }
        ]
    });
}; // ✅ missing closing brace fixed

// Helper to get stop name
const getStopName = async (stopId) => {
    const stop = await RouteStop.findByPk(stopId);
    return stop ? stop.stop_name : null;
};

const findActiveScheduleByBus = async (busId) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Try to find an ongoing schedule (in_progress AND time window matches)
    let schedule = await Schedule.findOne({
        where: {
            bus_id: busId,
            departure_time: { [Op.lte]: now },
            arrival_time: { [Op.gte]: now },
            trip_status: 'in_progress'
        },
        include: [{
            model: Route,
            as: 'Route',
            include: [{
                model: RouteStop,
                as: 'stops'
            }]
        }],
        order: [['departure_time', 'ASC']]
    });

    // 2. If no ongoing schedule, get the next scheduled trip for today (or future)
    if (!schedule) {
        schedule = await Schedule.findOne({
            where: {
                bus_id: busId,
                departure_time: { [Op.gte]: now },   // future or exactly now
                trip_status: { [Op.in]: ['scheduled', 'in_progress'] }
            },
            include: [{
                model: Route,
                as: 'Route',
                include: [{
                    model: RouteStop,
                    as: 'stops'
                }]
            }],
            order: [['departure_time', 'ASC']]
        });
    }

    // 3. If still nothing, try to find any schedule for today (fallback)
    if (!schedule) {
        schedule = await Schedule.findOne({
            where: {
                bus_id: busId,
                departure_time: { [Op.between]: [startOfDay, endOfDay] }
            },
            include: [{
                model: Route,
                as: 'Route',
                include: [{
                    model: RouteStop,
                    as: 'stops'
                }]
            }],
            order: [['departure_time', 'ASC']]
        });
    }

    return schedule;
};

const getDailyReport = async (date) => {
    const [result] = await sequelize.query(
        `SELECT COUNT(*)                                                   as total_trips,
                SUM(CASE WHEN trip_status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
                SUM(CASE WHEN trip_status = 'delayed' THEN 1 ELSE 0 END)   as delayed_trips,
                SUM(passenger_count)                                       as total_passengers,
                SUM(revenue)                                               as total_revenue,
                AVG(delay_minutes)                                         as avg_delay_minutes
         FROM srmss_schedule
         WHERE DATE(departure_time) = :date`,
        {
            replacements: { date: date },
            type: sequelize.QueryTypes.SELECT
        }
    );
    return result;
};

const findActiveScheduleByDriver = async (driverId) => {
    const now = new Date();
    // 1. Try to find ongoing schedule (current time between departure and arrival)
    let schedule = await Schedule.findOne({
        where: {
            driver_id: driverId,
            departure_time: { [Op.lte]: now },
            arrival_time: { [Op.gte]: now },
            trip_status: { [Op.in]: ['in_progress', 'scheduled'] }
        },
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

    // 2. If none, get the next upcoming schedule (departure_time >= now)
    if (!schedule) {
        schedule = await Schedule.findOne({
            where: {
                driver_id: driverId,
                departure_time: { [Op.gte]: now },
                trip_status: { [Op.in]: ['scheduled', 'in_progress'] }
            },
            include: [{
                model: Route,
                as: 'Route',
                include: [{
                    model: RouteStop,
                    as: 'stops',
                    order: [['stop_order', 'ASC']]
                }]
            }],
            order: [['departure_time', 'ASC']]
        });
    }

    // 3. If still none, try any schedule for today (fallback)
    if (!schedule) {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        schedule = await Schedule.findOne({
            where: {
                driver_id: driverId,
                departure_time: { [Op.between]: [startOfDay, endOfDay] }
            },
            include: [{
                model: Route,
                as: 'Route',
                include: [{
                    model: RouteStop,
                    as: 'stops',
                    order: [['stop_order', 'ASC']]
                }]
            }],
            order: [['departure_time', 'ASC']]
        });
    }

    return schedule;
};
const updateScheduleStops = async (scheduleId, currentStopId, nextStopId) => {
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) return null;
    return await schedule.update({
        current_stop_id: currentStopId,
        next_stop_id: nextStopId
    });
};

module.exports = {
    findAll,
    findById,
    findByCode,
    findTodaySchedules,
    findUpcomingSchedules,
    create,
    update,
    updateTripStatus,
    deleteSchedule,
    checkConflicts,
    getStatistics,
    getDailyReport,
    updateCurrentAndNextStop,
    getScheduleWithRouteStops,
    getStopName,
    findActiveScheduleByBus,
    updateScheduleStops,
    findActiveScheduleByDriver
};