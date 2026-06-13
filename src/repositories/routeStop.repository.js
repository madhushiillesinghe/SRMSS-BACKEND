const { RouteStop, sequelize } = require("../models");

// const findByRouteId = async (routeId) => {
//     return await RouteStop.findAll({
//         where: { route_id: routeId },
//         order: [["stop_order", "ASC"]]
//     });
// };
const findByRouteId = async (routeId) => {
    try {
        const [rows] = await sequelize.query(
            `SELECT stop_id, stop_name, stop_order, distance_from_start, estimated_arrival_time
             FROM srmss_route_stop
             WHERE route_id = ?
             ORDER BY stop_order ASC`,
            {
                replacements: [routeId],
                type: sequelize.QueryTypes.SELECT
            }
        );
        return rows || [];   //  always return an array
    } catch (error) {
        console.error("Error in findByRouteId:", error);
        return [];           //  return empty array on error
    }
};const findById = async (id) => {
    return await RouteStop.findByPk(id);
};

const create = async (data) => {
    return await RouteStop.create(data);
};

const bulkCreate = async (stops) => {
    return await RouteStop.bulkCreate(stops);
};

const update = async (id, data) => {
    const stop = await RouteStop.findByPk(id);
    if (!stop) return null;
    return await stop.update(data);
};

const deleteStop = async (id) => {
    const stop = await RouteStop.findByPk(id);
    if (!stop) return null;
    await stop.destroy();
    return true;
};

const deleteByRouteId = async (routeId) => {
    return await RouteStop.destroy({ where: { route_id: routeId } });
};

// FIXED: Correct SQL syntax for parameterized query
const calculateDistanceBetweenStops = async (fromStopId, toStopId) => {
    const [result] = await sequelize.query(
        `SELECT ABS(s1.distance_from_start - s2.distance_from_start) as distance
         FROM srmss_route_stop s1, srmss_route_stop s2
         WHERE s1.stop_id = ? AND s2.stop_id = ?`,
        {
            replacements: [fromStopId, toStopId],
            type: sequelize.QueryTypes.SELECT
        }
    );
    return result?.distance || 0;
};

const getNextStop = async (routeId, currentStopOrder) => {
    return await RouteStop.findOne({
        where: {
            route_id: routeId,
            stop_order: currentStopOrder + 1
        }
    });
};

const getPreviousStop = async (routeId, currentStopOrder) => {
    return await RouteStop.findOne({
        where: {
            route_id: routeId,
            stop_order: currentStopOrder - 1
        }
    });
};

module.exports = {
    findByRouteId,
    findById,
    create,
    bulkCreate,
    update,
    deleteStop,
    deleteByRouteId,
    calculateDistanceBetweenStops,
    getNextStop,
    getPreviousStop
};