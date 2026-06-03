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
};const getBusRouteProgress = async (busId, scheduleId) => {
    const [result] = await sequelize.query(`
        SELECT
            l.*,
            r.total_distance,
            r.estimated_duration,
            rs.stop_name as next_stop_name,
            rs.distance_from_start as next_stop_distance,
            (rs.distance_from_start - l.distance_traveled) as remaining_distance,
            CASE
                WHEN l.speed > 0 THEN (rs.distance_from_start - l.distance_traveled) / l.speed * 60
                ELSE rs.estimated_arrival_time - l.elapsed_time
                END as estimated_minutes_to_next_stop
        FROM srmss_bus_location l
                 JOIN srmss_schedule s ON l.schedule_id = s.schedule_id
                 JOIN srmss_route r ON s.route_id = r.route_id
                 LEFT JOIN srmss_route_stop rs
                           ON rs.route_id = r.route_id
                               AND rs.distance_from_start > l.distance_traveled
        WHERE l.bus_id = :busId
          AND l.schedule_id = :scheduleId
        ORDER BY rs.distance_from_start ASC
            LIMIT 1
    `, {
        replacements: { busId, scheduleId },
        type: sequelize.QueryTypes.SELECT
    });

    return result;
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