const { Route, RouteStop, sequelize } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
        where[Op.or] = [
            { route_name: { [Op.like]: `%${filters.search}%` } },
            { route_code: { [Op.like]: `%${filters.search}%` } },
            { start_location: { [Op.like]: `%${filters.search}%` } },
            { end_location: { [Op.like]: `%${filters.search}%` } }
        ];
    }

    return await Route.findAll({
        where,
        include: [{ model: RouteStop, as: "stops", order: [["stop_order", "ASC"]] }],
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Route.findByPk(id, {
        include: [{ model: RouteStop, as: "stops", order: [["stop_order", "ASC"]] }]
    });
};

const findByCode = async (code) => {
    return await Route.findOne({ where: { route_code: code } });
};

const create = async (data) => {
    return await Route.create(data);
};

const update = async (id, data) => {
    const route = await Route.findByPk(id);
    if (!route) return null;
    return await route.update(data);
};

const deleteRoute = async (id) => {
    const route = await Route.findByPk(id);
    if (!route) return null;
    await route.update({ status: "inactive" });
    return route;
};

const getActiveRoutes = async () => {
    return await Route.findAll({
        where: { status: "active" },
        include: [{ model: RouteStop, as: "stops", order: [["stop_order", "ASC"]] }],
        order: [["route_name", "ASC"]]
    });
};

const getRouteWithStops = async (id) => {
    return await Route.findByPk(id, {
        include: [{ model: RouteStop, as: "stops", order: [["stop_order", "ASC"]] }]
    });
};

const getStatistics = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            COUNT(*) as total_routes,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_routes,
            AVG(total_distance) as avg_distance,
            SUM(total_distance) as total_distance_km,
            AVG(estimated_duration) as avg_duration,
            SUM(estimated_duration) as total_duration_minutes
        FROM srmss_route
    `);
    return result[0];
};

module.exports = {
    findAll,
    findById,
    findByCode,
    create,
    update,
    deleteRoute,
    getActiveRoutes,
    getRouteWithStops,
    getStatistics
};