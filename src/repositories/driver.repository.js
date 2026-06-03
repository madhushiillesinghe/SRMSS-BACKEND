const { Driver, Route, sequelize } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
        where[Op.or] = [
            { first_name: { [Op.like]: `%${filters.search}%` } },
            { last_name: { [Op.like]: `%${filters.search}%` } },
            { driver_code: { [Op.like]: `%${filters.search}%` } },
            { license_number: { [Op.like]: `%${filters.search}%` } },
            { nic_number: { [Op.like]: `%${filters.search}%` } }
        ];
    }

    return await Driver.findAll({
        where,
        include: [{ model: Route, as: "route", attributes: ["route_name", "route_code"] }],
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Driver.findByPk(id, {
        include: [{ model: Route, as: "route" }]
    });
};

const findByLicense = async (licenseNumber) => {
    return await Driver.findOne({ where: { license_number: licenseNumber } });
};

const findByCode = async (code) => {
    return await Driver.findOne({ where: { driver_code: code } });
};

const findByNIC = async (nic) => {
    return await Driver.findOne({ where: { nic_number: nic } });
};

const create = async (data) => {
    if (!data.driver_code) {
        const count = await Driver.count();
        data.driver_code = `DRV${String(count + 1).padStart(4, '0')}`;
    }
    return await Driver.create(data);
};

const update = async (id, data) => {
    const driver = await Driver.findByPk(id);
    if (!driver) return null;
    return await driver.update(data);
};

const deleteDriver = async (id) => {
    const driver = await Driver.findByPk(id);
    if (!driver) return null;
    await driver.update({ status: "terminated" });
    return driver;
};

const getActiveDrivers = async () => {
    return await Driver.findAll({
        where: {
            status: "available",
            license_expiry: { [Op.gt]: new Date() }
        },
        include: [{ model: Route, as: "route" }]
    });
};

const getDriversOnDuty = async () => {
    return await Driver.findAll({
        where: { status: "on_duty" },
        include: [{ model: Route, as: "route" }]
    });
};

const getExpiringLicenses = async (days = 30) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await Driver.findAll({
        where: {
            license_expiry: { [Op.lte]: expiryDate },
            status: { [Op.ne]: "terminated" }
        },
        include: [{ model: Route, as: "route" }]
    });
};

const updateWorkingHours = async (id, hours) => {
    const driver = await Driver.findByPk(id);
    if (!driver) return null;
    return await driver.update({
        current_working_hours: driver.current_working_hours + hours
    });
};

const resetDailyWorkingHours = async () => {
    return await Driver.update(
        { current_working_hours: 0 },
        { where: {} }
    );
};

const updateRating = async (id, newRating) => {
    const driver = await Driver.findByPk(id);
    if (!driver) return null;
    const avgRating = (driver.rating + newRating) / 2;
    return await driver.update({ rating: avgRating });
};

const getStatistics = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            COUNT(*) as total_drivers,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN status = 'on_duty' THEN 1 ELSE 0 END) as on_duty,
            SUM(CASE WHEN status = 'off_duty' THEN 1 ELSE 0 END) as off_duty,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
            SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated_count,            SUM(CASE WHEN license_expiry < CURDATE() THEN 1 ELSE 0 END) as expired_licenses,
            SUM(CASE WHEN license_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
            AVG(rating) as avg_rating,
            AVG(current_working_hours) as avg_working_hours
        FROM srmss_driver
    `);
    return result[0];
};

module.exports = {
    findAll,
    findById,
    findByLicense,
    findByCode,
    findByNIC,
    create,
    update,
    deleteDriver,
    getActiveDrivers,
    getDriversOnDuty,
    getExpiringLicenses,
    updateWorkingHours,
    resetDailyWorkingHours,
    updateRating,
    getStatistics
};