const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Driver = sequelize.define("Driver", {
    driver_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    driver_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'driver_code'
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name'
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name'
    },
    nic_number: {
        type: DataTypes.STRING(20),
        unique: true,
        field: 'nic_number'
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        validate: { isEmail: true }
    },
    address: {
        type: DataTypes.TEXT
    },
    license_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'license_number'
    },
    license_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'license_expiry'
    },
    license_class: {
        type: DataTypes.STRING(100),
        field: 'license_class'
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
        field: 'date_of_birth'
    },
    hire_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'hire_date'
    },
    emergency_contact: {
        type: DataTypes.STRING(15),
        field: 'emergency_contact'
    },
    emergency_contact_name: {
        type: DataTypes.STRING(100),
        field: 'emergency_contact_name'
    },
    max_working_hours_per_day: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        field: 'max_working_hours_per_day'
    },
    current_working_hours: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'current_working_hours'
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 5.0
    },
    status: {
        type: DataTypes.ENUM("available", "on_duty", "off_duty", "suspended", "terminated"),
        defaultValue: "available"
    },
    assigned_route_id: {
        type: DataTypes.INTEGER,
        field: 'assigned_route_id',
        references: { model: 'srmss_route', key: 'route_id' }
    },
    profile_image: {
        type: DataTypes.STRING(255),
        field: 'profile_image'
    },
    notes: {
        type: DataTypes.TEXT
    },
    created_by: {
        type: DataTypes.INTEGER,
        field: 'created_by',
        references: { model: 'srmss_admin', key: 'admin_id' }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: "srmss_driver",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

Driver.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

Driver.prototype.isLicenseValid = function() {
    return new Date(this.license_expiry) > new Date();
};

Driver.prototype.isAvailableForDuty = function() {
    return this.status === "available" && this.isLicenseValid();
};

Driver.prototype.canTakeMoreHours = function(hours) {
    return (this.current_working_hours + hours) <= this.max_working_hours_per_day;
};

module.exports = Driver;