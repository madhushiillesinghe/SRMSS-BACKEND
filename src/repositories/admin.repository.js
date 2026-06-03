const { Admin, sequelize } = require("../models");
const { Op } = require("sequelize");

const findByUsername = async (username) => {
    return await Admin.findOne({ where: { username } });
};

const findByEmail = async (email) => {
    return await Admin.findOne({ where: { email } });
};

const findById = async (id) => {
    return await Admin.findByPk(id, {
        attributes: { exclude: ["password"] }
    });
};

const findByIdWithPassword = async (id) => {
    return await Admin.findByPk(id);
};

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.role) where.role = filters.role;
    if (filters.search) {
        where[Op.or] = [
            { username: { [Op.like]: `%${filters.search}%` } },
            { full_name: { [Op.like]: `%${filters.search}%` } },
            { email: { [Op.like]: `%${filters.search}%` } }
        ];
    }

    return await Admin.findAll({
        where,
        attributes: { exclude: ["password"] },
        order: [["created_at", "DESC"]]
    });
};

const create = async (data) => {
    return await Admin.create(data);
};

const update = async (id, data) => {
    const admin = await Admin.findByPk(id);
    if (!admin) return null;
    return await admin.update(data);
};

const updateLastLogin = async (id, lastLogin) => {
    return await Admin.update({ last_login: lastLogin }, { where: { admin_id: id } });
};

const updatePassword = async (id, hashedPassword) => {
    return await Admin.update({ password: hashedPassword }, { where: { admin_id: id } });
};

const updateStatus = async (id, status) => {
    return await Admin.update({ status }, { where: { admin_id: id } });
};

const deleteAdmin = async (id) => {
    return await Admin.update({ status: "inactive" }, { where: { admin_id: id } });
};

const getStatistics = async () => {
    const [result] = await sequelize.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
            SUM(CASE WHEN role = 'depot_manager' THEN 1 ELSE 0 END) as depot_managers
        FROM srmss_admin
    `);
    return result[0];
};

module.exports = {
    findByUsername,
    findByEmail,
    findById,
    findByIdWithPassword,
    findAll,
    create,
    update,
    updateLastLogin,
    updatePassword,
    updateStatus,
    deleteAdmin,
    getStatistics
};