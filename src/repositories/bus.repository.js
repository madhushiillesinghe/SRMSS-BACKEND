const { Op } = require("sequelize");
const { Bus, Route } = require("../models");
const sequelize = require("../config/db");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.bus_type) where.bus_type = filters.bus_type;
    if (filters.fuel_type) where.fuel_type = filters.fuel_type;
    if (filters.search) {
        where[Op.or] = [
            { registration_number: { [Op.like]: `%${filters.search}%` } },
            { bus_model: { [Op.like]: `%${filters.search}%` } }
        ];
    }

    return await Bus.findAll({
        where,
        include: [{ model: Route, as: "route", attributes: ["route_name", "route_code"] }],
        order: [["created_at", "DESC"]],
        required: false
    });
};

const findById = async (id) => {
    return await Bus.findByPk(id, {
        include: [{ model: Route, as: "route" }],
        required: false
    });
};

const findByRegistration = async (regNumber) => {
    return await Bus.findOne({ where: { registration_number: regNumber } });
};

const create = async (data) => {
    return await Bus.create(data);
};

const update = async (id, data) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    return await bus.update(data);
};

const deleteBus = async (id) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    await bus.update({ status: "inactive" });
    return bus;
};

const getAvailableBuses = async () => {
    return await Bus.findAll({
        where: { status: "available" },
        include: [{ model: Route, as: "route" }],
        required: false

    });
};

const getBusesOnRoute = async () => {
    return await Bus.findAll({
        where: { status: "on_route" },
        include: [{ model: Route, as: "route" }]
    });
};

const getBusesInMaintenance = async () => {
    return await Bus.findAll({
        where: { status: "maintenance" },
        include: [{ model: Route, as: "route" }]
    });
};

const getMaintenanceDueBuses = async () => {
    const today = new Date();
    return await Bus.findAll({
        where: {
            [Op.or]: [
                { next_maintenance_due: { [Op.lte]: today } },
                sequelize.where(
                    sequelize.literal(`(current_odometer - COALESCE(last_maintenance_odometer, 0))`),
                    { [Op.gte]: sequelize.col('maintenance_interval_km') }
                )
            ],
            status: { [Op.ne]: "maintenance" }
        },
        include: [{ model: Route, as: "route" }]
    });
};

const updateBusOdometer = async (id, newOdometer) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    return await bus.update({ current_odometer: newOdometer });
};

const assignRoute = async (id, routeId) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    return await bus.update({ assigned_route_id: routeId });
};
const findById2 =async(busId) =>{
    const [rows] = await db.query('SELECT * FROM bus WHERE id = ?', [busId]);
    return rows[0] || null;
}

// NEW: get all active buses
const findAllActive = async () => {
    return await Bus.findAll({
        where: {
            status: ['available', 'on_route']   // active buses
        }
    });
};
const getStatistics = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            COUNT(*) as total_buses,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN status = 'on_route' THEN 1 ELSE 0 END) as on_route,
            SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN bus_type = 'AC' THEN 1 ELSE 0 END) as ac_buses,
            SUM(CASE WHEN bus_type = 'Non-AC' THEN 1 ELSE 0 END) as non_ac_buses,
            SUM(CASE WHEN fuel_type = 'Diesel' THEN 1 ELSE 0 END) as diesel_buses,
            SUM(CASE WHEN fuel_type = 'Electric' THEN 1 ELSE 0 END) as electric_buses,
            SUM(capacity) as total_capacity,
            AVG(capacity) as avg_capacity,
            AVG(mileage) as avg_mileage
        FROM srmss_bus
    `);
    return result[0];
};
module.exports = {
    findAll,
    findById,
    findByRegistration,
    create,
    update,
    deleteBus,
    getAvailableBuses,
    getBusesOnRoute,
    getBusesInMaintenance,
    getMaintenanceDueBuses,
    updateBusOdometer,
    assignRoute,
    getStatistics,
    findAllActive,
    findById2
};