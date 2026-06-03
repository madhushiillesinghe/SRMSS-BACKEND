const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");
const { DataTypes, Op } = require("sequelize");

const Admin = sequelize.define("Admin", {
    admin_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'full_name'
    },
    phone: {
        type: DataTypes.STRING(15)
    },
    role: {
        type: DataTypes.ENUM("super_admin", "depot_manager", "scheduler", "ticket_officer", "viewer"),
        defaultValue: "viewer"
    },
    status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        defaultValue: "active"
    },
    last_login: {
        type: DataTypes.DATE,
        field: 'last_login'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "srmss_admin",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: []
});

// Hash password before create/update
Admin.beforeCreate(async (admin) => {
    if (admin.password) {
        admin.password = await bcrypt.hash(admin.password, 10);
    }
});

Admin.beforeUpdate(async (admin) => {
    if (admin.changed('password')) {
        admin.password = await bcrypt.hash(admin.password, 10);
    }
});

Admin.prototype.verifyPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Static method to create default admin
Admin.createDefaultAdmin = async function() {
    const defaultAdmin = {
        username: process.env.ADMIN_USERNAME || "superadmin",
        email: process.env.ADMIN_EMAIL || "admin@srmss.com",
        password: process.env.ADMIN_PASSWORD || "Admin@123",
        full_name: process.env.ADMIN_FULL_NAME || "System Administrator",
        role: "super_admin",
        status: "active",
        phone: "0712345678"
    };

    const existingAdmin = await this.findOne({
        where: {
            [Op.or]: [
                { username: defaultAdmin.username },
                { email: defaultAdmin.email }
            ]
        }
    });

    if (!existingAdmin) {
        await this.create(defaultAdmin);
        console.log(" Default admin user created successfully");
        console.log(`   Username: ${defaultAdmin.username}`);
        console.log(`   Password: ${defaultAdmin.password}`);
        return true;
    }

    console.log("ℹ️ Default admin user already exists");
    return false;
};

module.exports = Admin;