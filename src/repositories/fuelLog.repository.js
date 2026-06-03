const { FuelLog, Bus, Schedule, sequelize } = require("../models");
const { Op } = require("sequelize");
const findAll = async (filters = {}) => {
    const where = {};
    if (filters.bus_id) where.bus_id = filters.bus_id;
    if (filters.from_date) {
        where.fuel_date = { [Op.gte]: filters.from_date };
    }
    if (filters.to_date) {
        where.fuel_date = { ...where.fuel_date, [Op.lte]: filters.to_date };
    }

    return await FuelLog.findAll({
        where,
        include: [
            { model: Bus, as: "Bus" },
            { model: Schedule, as: "Schedule" }
        ],
        order: [["fuel_date", "DESC"]]
    });
};

const findById = async (id) => {
    return await FuelLog.findByPk(id, {
        include: [{ model: Bus, as: "Bus" }]
    });
};

const create = async (data) => {
    if (!data.total_cost && data.fuel_amount && data.cost_per_liter) {
        data.total_cost = data.fuel_amount * data.cost_per_liter;
    }
    return await FuelLog.create(data);
};

const update = async (id, data) => {
    const log = await FuelLog.findByPk(id);
    if (!log) return null;

    if (data.fuel_amount && data.cost_per_liter) {
        data.total_cost = data.fuel_amount * data.cost_per_liter;
    }
    return await log.update(data);
};

const deleteLog = async (id) => {
    const log = await FuelLog.findByPk(id);
    if (!log) return null;
    await log.destroy();
    return true;
};

const getBusFuelHistory = async (busId, days = 30) => {
    return await FuelLog.findAll({
        where: {
            bus_id: busId,
            fuel_date: { [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
        },
        order: [["fuel_date", "ASC"]]
    });
};

const getStatistics = async (busId = null, days = 30) => {

    const replacements = { days };

    let busFilter = "";
    if (busId) {
        busFilter = "AND bus_id = :busId";
        replacements.busId = busId;
    }

    const query = `
        SELECT
            SUM(fuel_amount) as total_fuel_liters,
            SUM(total_cost) as total_cost,
            AVG(cost_per_liter) as avg_cost_per_liter,
            COUNT(*) as refuel_count,
            AVG(fuel_amount) as avg_fuel_per_refuel,
            MAX(fuel_amount) as max_fuel,
            MIN(fuel_amount) as min_fuel,
            SUM(total_cost) / SUM(fuel_amount) as effective_rate
        FROM srmss_fuel_log
        WHERE fuel_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        ${busFilter}
    `;

    const [result] = await sequelize.query(query, {
        replacements
    });

    return result[0];
};
const getFuelEfficiency = async (bus_id, days = 30) => {

    const query = `
        SELECT
            f1.fuel_date,
            f1.fuel_amount,
            f1.odometer_reading,
            f2.odometer_reading as prev_odometer,
            (f1.odometer_reading - f2.odometer_reading) as distance_traveled,
            (f1.odometer_reading - f2.odometer_reading) / f1.fuel_amount as efficiency
        FROM srmss_fuel_log f1
        LEFT JOIN srmss_fuel_log f2 
            ON f2.bus_id = f1.bus_id
            AND f2.fuel_date < f1.fuel_date
        WHERE f1.bus_id = :bus_id
          AND f1.fuel_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        ORDER BY f1.fuel_date ASC
    `;

    const [result] = await sequelize.query(query, {
        replacements: { bus_id }
    });

    return result;
};
module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteLog,
    getBusFuelHistory,
    getStatistics,
    getFuelEfficiency
};