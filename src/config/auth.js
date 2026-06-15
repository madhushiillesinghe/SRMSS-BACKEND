// config/auth.js
module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    roles: {
        SUPER_ADMIN: 'super_admin',
        DEPOT_MANAGER: 'depot_manager',
        LOGISTICS_OFFICER: 'logistics_officer'
    },
    defaultAdmin: {
        username: process.env.ADMIN_USERNAME || 'superadmin',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        email: process.env.ADMIN_EMAIL || 'admin@srmss.com',
        full_name: 'System Administrator',
        role: 'super_admin'
    }
};