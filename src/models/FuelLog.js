const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FuelLog = sequelize.define("FuelLog", {
    log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bus_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'bus_id',
        references: { model: 'srmss_bus', key: 'bus_id' }
    },
    schedule_id: {
        type: DataTypes.INTEGER,
        field: 'schedule_id',
        references: { model: 'srmss_schedule', key: 'schedule_id' },
        comment: 'which trip this fuel was for'
    },
    fuel_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fuel_date'
    },
    fuel_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'fuel_amount',
        comment: 'liters'
    },
    cost_per_liter: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'cost_per_liter'
    },
    total_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_cost'
    },
    odometer_reading: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'odometer_reading'
    },
    fuel_type: {
        type: DataTypes.ENUM("Diesel", "Petrol", "Electric", "CNG"),
        allowNull: false,
        field: 'fuel_type'
    },
    refueling_location: {
        type: DataTypes.STRING(100),
        field: 'refueling_location'
    },
    receipt_number: {
        type: DataTypes.STRING(50),
        field: 'receipt_number'
    },
    remarks: {
        type: DataTypes.TEXT
    },
    recorded_by: {
        type: DataTypes.INTEGER,
        field: 'recorded_by',
        references: { model: 'srmss_admin', key: 'admin_id' }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: "srmss_fuel_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: []
});

FuelLog.prototype.getFuelEfficiency = function(previousOdometer) {
    if (!previousOdometer) return null;
    const distance = this.odometer_reading - previousOdometer;
    return distance / this.fuel_amount;
};

module.exports = FuelLog;