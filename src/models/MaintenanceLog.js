const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MaintenanceLog = sequelize.define("MaintenanceLog", {
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
    maintenance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'maintenance_date'
    },
    maintenance_type: {
        type: DataTypes.ENUM("routine", "corrective", "emergency", "preventive"),
        allowNull: false,
        field: 'maintenance_type'
    },
    maintenance_category: {
        type: DataTypes.ENUM("engine", "brake", "tire", "electrical", "body", "AC", "other"),
        allowNull: false,
        field: 'maintenance_category'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    odometer_at_service: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'odometer_at_service'
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    vendor_name: {
        type: DataTypes.STRING(100),
        field: 'vendor_name'
    },
    invoice_number: {
        type: DataTypes.STRING(50),
        field: 'invoice_number'
    },
    next_due_date: {
        type: DataTypes.DATEONLY,
        field: 'next_due_date'
    },
    next_due_odometer: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'next_due_odometer'
    },
    status: {
        type: DataTypes.ENUM("scheduled", "in_progress", "completed", "cancelled"),
        defaultValue: "scheduled"
    },
    completed_by: {
        type: DataTypes.STRING(100),
        field: 'completed_by'
    },
    remarks: {
        type: DataTypes.TEXT
    },
    performed_by: {
        type: DataTypes.INTEGER,
        field: 'performed_by',
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
    tableName: "srmss_maintenance_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

MaintenanceLog.prototype.isNextDue = function() {
    if (this.next_due_date) {
        return new Date(this.next_due_date) <= new Date();
    }
    return false;
};

MaintenanceLog.prototype.getTotalCostByType = function(cost, type) {
    if (this.maintenance_type === type) {
        return cost;
    }
    return 0;
};

module.exports = MaintenanceLog;