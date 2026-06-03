const { MaintenanceLog, Bus, sequelize } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.bus_id) where.bus_id = filters.bus_id;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.maintenance_type = filters.type;
    if (filters.category) where.maintenance_category = filters.category;
    if (filters.from_date) {
        where.maintenance_date = { [Op.gte]: filters.from_date };
    }
    if (filters.to_date) {
        where.maintenance_date = { ...where.maintenance_date, [Op.lte]: filters.to_date };
    }

    return await MaintenanceLog.findAll({
        where,
        include: [{ model: Bus, as: "Bus" }],
        order: [["maintenance_date", "DESC"]]
    });
};

const findById = async (id) => {
    return await MaintenanceLog.findByPk(id, {
        include: [{ model: Bus, as: "Bus" }]
    });
};

const create = async (data) => {
    return await MaintenanceLog.create(data);
};

const update = async (id, data) => {
    const log = await MaintenanceLog.findByPk(id);
    if (!log) return null;
    return await log.update(data);
};

const deleteLog = async (id) => {
    const log = await MaintenanceLog.findByPk(id);
    if (!log) return null;
    await log.destroy();
    return true;
};

const getBusMaintenanceHistory = async (busId) => {
    return await MaintenanceLog.findAll({
        where: { bus_id: busId },
        order: [["maintenance_date", "DESC"]]
    });
};

const getUpcomingMaintenance = async (days = 7) => {
    return await MaintenanceLog.findAll({
        where: {
            next_due_date: { [Op.lte]: new Date(Date.now() + days * 24 * 60 * 60 * 1000) },
            status: { [Op.ne]: "completed" }
        },
        include: [{ model: Bus, as: "Bus" }],
        order: [["next_due_date", "ASC"]]
    });
};

const completeMaintenance = async (id, completedBy) => {
    const log = await MaintenanceLog.findByPk(id);
    if (!log) return null;

    await log.update({
        status: "completed",
        completed_by: completedBy
    });

    // Update bus last maintenance date
    if (log.bus_id) {
        await Bus.update(
            {
                last_maintenance_date: new Date(),
                next_maintenance_due: log.next_due_date,
                last_maintenance_odometer: log.odometer_at_service
            },
            { where: { bus_id: log.bus_id } }
        );
    }

    return log;
};

const getStatistics = async (busId = null, days = 90) => {
    days = Number(days) || 90;

    const busFilter = busId ? `AND bus_id = ${Number(busId)}` : "";

    const [result] = await sequelize.query(`
        SELECT
            COUNT(*) as total_maintenance,
            SUM(CASE WHEN maintenance_type = 'routine' THEN 1 ELSE 0 END) as routine_count,
            SUM(CASE WHEN maintenance_type = 'corrective' THEN 1 ELSE 0 END) as corrective_count,
            SUM(CASE WHEN maintenance_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count,
            SUM(CASE WHEN maintenance_type = 'preventive' THEN 1 ELSE 0 END) as preventive_count,
            SUM(cost) as total_cost,
            AVG(cost) as avg_cost,
            SUM(CASE WHEN maintenance_category = 'engine' THEN cost ELSE 0 END) as engine_cost,
            SUM(CASE WHEN maintenance_category = 'brake' THEN cost ELSE 0 END) as brake_cost,
            SUM(CASE WHEN maintenance_category = 'tire' THEN cost ELSE 0 END) as tire_cost,
            SUM(CASE WHEN maintenance_category = 'electrical' THEN cost ELSE 0 END) as electrical_cost,
            SUM(CASE WHEN maintenance_category = 'AC' THEN cost ELSE 0 END) as ac_cost
        FROM srmss_maintenance_log
        WHERE maintenance_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
            ${busFilter}
    `);

    return result[0];
};
module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteLog,
    getBusMaintenanceHistory,
    getUpcomingMaintenance,
    completeMaintenance,
    getStatistics
};