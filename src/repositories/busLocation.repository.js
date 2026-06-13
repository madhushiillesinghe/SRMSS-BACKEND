const { BusLocation, Bus, Schedule, RouteStop, sequelize } = require("../models");
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

const findLatestByScheduleId = async (scheduleId) => {
    return await BusLocation.findOne({
        where: { schedule_id: scheduleId },
        include: [{ model: Bus, as: "Bus" }],
        order: [["recorded_at", "DESC"]]
    });
};

const findHistoryByBusId = async (busId, limit = 100) => {
    return await BusLocation.findAll({
        where: { bus_id: busId },
        include: [{ model: Bus, as: "Bus" }],
        order: [["recorded_at", "DESC"]],
        limit
    });
};

const create = async (data) => {
    return await BusLocation.create(data);
};

const update = async (id, data) => {
    const location = await BusLocation.findByPk(id);
    if (!location) return null;
    return await location.update(data);
};

const deleteLocation = async (id) => {
    const location = await BusLocation.findByPk(id);
    if (!location) return null;
    await location.destroy();
    return true;
};

const deleteOldLocations = async (days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await BusLocation.destroy({
        where: { recorded_at: { [Op.lt]: cutoffDate } }
    });
};

const getActiveBusesLocations = async () => {
    const [result] = await sequelize.query(`
        SELECT *
        FROM srmss_bus_location
        WHERE status = 'active'
          AND recorded_at IN (
            SELECT MAX(recorded_at)
            FROM srmss_bus_location
            GROUP BY bus_id
        )
    `);

    return result;
};
// src/repositories/busLocation.repository.js
const getBusRouteProgress = async (busId, scheduleId) => {
    const [result] = await sequelize.query(`
        SELECT
            l.*,
            r.total_distance,
            r.estimated_duration,
            -- Current stop (the last stop where distance_from_start <= distance_traveled)
            cs.stop_id AS current_stop_id,
            cs.stop_name AS current_stop_name,
            cs.stop_order AS current_stop_order,
            cs.distance_from_start AS current_stop_distance,
            -- Next stop (the first stop where distance_from_start > distance_traveled)
            ns.stop_id AS next_stop_id,
            ns.stop_name AS next_stop_name,
            ns.stop_order AS next_stop_order,
            ns.distance_from_start AS next_stop_distance,
            (ns.distance_from_start - l.distance_traveled) AS remaining_distance,
            CASE
                WHEN l.speed > 0 THEN (ns.distance_from_start - l.distance_traveled) / l.speed * 60
                ELSE ns.estimated_arrival_time - l.elapsed_time
                END AS estimated_minutes_to_next_stop
        FROM srmss_bus_location l
                 JOIN srmss_schedule s ON l.schedule_id = s.schedule_id
                 JOIN srmss_route r ON s.route_id = r.route_id
            -- Find current stop: the stop with greatest distance <= distance_traveled
                 LEFT JOIN srmss_route_stop cs
                           ON cs.route_id = r.route_id
                               AND cs.distance_from_start <= l.distance_traveled
            -- Find next stop: the stop with smallest distance > distance_traveled
                 LEFT JOIN srmss_route_stop ns
                           ON ns.route_id = r.route_id
                               AND ns.distance_from_start > l.distance_traveled
        WHERE l.bus_id = :busId
          AND l.schedule_id = :scheduleId
        ORDER BY ns.distance_from_start ASC, cs.distance_from_start DESC
            LIMIT 1
    `, {
        replacements: { busId, scheduleId },
        type: sequelize.QueryTypes.SELECT
    });

    // If no location found, return null
    if (!result) return null;

    // Optionally, find the actual current stop (the one with max distance <= distance_traveled)
    // because the LEFT JOIN may return multiple rows if not grouped; we use ORDER BY and LIMIT 1.
    // The above query orders by ns.distance_from_start ASC (so next stop first) and also cs.distance_from_start DESC.
    // Using LIMIT 1 will give us one row with the current and next stop as described.
    // However, due to two LEFT JOINs, we might get a cartesian product if there are multiple matches.
    // Better to use subqueries or a different approach.

    // Alternative: Use subqueries for clarity and correctness.
    const [resultAlt] = await sequelize.query(`
        SELECT
            l.*,
            r.total_distance,
            r.estimated_duration,
            (SELECT stop_id FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start <= l.distance_traveled
             ORDER BY distance_from_start DESC LIMIT 1) AS current_stop_id,
            (SELECT stop_name FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start <= l.distance_traveled
             ORDER BY distance_from_start DESC LIMIT 1) AS current_stop_name,
            (SELECT stop_order FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start <= l.distance_traveled
             ORDER BY distance_from_start DESC LIMIT 1) AS current_stop_order,
            (SELECT distance_from_start FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start <= l.distance_traveled
             ORDER BY distance_from_start DESC LIMIT 1) AS current_stop_distance,
            (SELECT stop_id FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
             ORDER BY distance_from_start ASC LIMIT 1) AS next_stop_id,
            (SELECT stop_name FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
             ORDER BY distance_from_start ASC LIMIT 1) AS next_stop_name,
            (SELECT stop_order FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
             ORDER BY distance_from_start ASC LIMIT 1) AS next_stop_order,
            (SELECT distance_from_start FROM srmss_route_stop 
             WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
             ORDER BY distance_from_start ASC LIMIT 1) AS next_stop_distance,
            ( (SELECT distance_from_start FROM srmss_route_stop 
               WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
               ORDER BY distance_from_start ASC LIMIT 1) - l.distance_traveled ) AS remaining_distance,
            CASE
                WHEN l.speed > 0 THEN ( (SELECT distance_from_start FROM srmss_route_stop 
                                        WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
                                        ORDER BY distance_from_start ASC LIMIT 1) - l.distance_traveled ) / l.speed * 60
                ELSE (SELECT estimated_arrival_time FROM srmss_route_stop 
                      WHERE route_id = r.route_id AND distance_from_start > l.distance_traveled
                      ORDER BY distance_from_start ASC LIMIT 1) - l.elapsed_time
            END AS estimated_minutes_to_next_stop
        FROM srmss_bus_location l
        JOIN srmss_schedule s ON l.schedule_id = s.schedule_id
        JOIN srmss_route r ON s.route_id = r.route_id
        WHERE l.bus_id = :busId AND l.schedule_id = :scheduleId
        LIMIT 1
    `, {
        replacements: { busId, scheduleId },
        type: sequelize.QueryTypes.SELECT
    });

    return resultAlt;
};
module.exports = {
    findAll,
    findById,
    findLatestByBusId,
    findLatestByScheduleId,
    findHistoryByBusId,
    create,
    update,
    deleteLocation,
    deleteOldLocations,
    getActiveBusesLocations,
    getBusRouteProgress
};