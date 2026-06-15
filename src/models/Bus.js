const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bus = sequelize.define("Bus", {
    bus_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    registration_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'registration_number'
    },
    bus_model: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'bus_model'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'number of seats'
    },
    bus_type: {
        type: DataTypes.ENUM("AC", "Non-AC", "Luxury", "Semi-Luxury"),
        defaultValue: "Non-AC",
        field: 'bus_type'
    },
    fuel_type: {
        type: DataTypes.ENUM("Diesel", "Petrol", "Electric", "CNG"),
        allowNull: false,
        field: 'fuel_type'
    },
    mileage: {
        type: DataTypes.DECIMAL(10, 2),
        comment: 'km per liter'
    },
    current_odometer: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'current_odometer'
    },
    manufacturing_year: {
        type: DataTypes.INTEGER,
        field: 'manufacturing_year'
    },
    last_maintenance_date: {
        type: DataTypes.DATEONLY,
        field: 'last_maintenance_date'
    },
    next_maintenance_due: {
        type: DataTypes.DATEONLY,
        field: 'next_maintenance_due'
    },
    last_maintenance_odometer: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'last_maintenance_odometer'
    },
    maintenance_interval_km: {
        type: DataTypes.INTEGER,
        defaultValue: 5000,
        field: 'maintenance_interval_km'
    },
    status: {
        type: DataTypes.ENUM("available", "on_route", "maintenance", "inactive"),
        defaultValue: "available"
    },
    assigned_route_id: {
        type: DataTypes.INTEGER,
        field: 'assigned_route_id',
        references: { model: 'srmss_route', key: 'route_id' }
    },
    qr_code: {
        type: DataTypes.STRING(255),
        field: 'qr_code'
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
    tableName: "srmss_bus",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

Bus.prototype.isAvailable = function() {
    return this.status === "available";
};

Bus.prototype.isMaintenanceDue = function() {
    if (!this.next_maintenance_due) return false;
    return new Date(this.next_maintenance_due) <= new Date();
};

Bus.prototype.getOccupancyRate = function(currentPassengers) {
    return (currentPassengers / this.capacity) * 100;
};

module.exports = Bus;