const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Schedule = sequelize.define("Schedule", {
    schedule_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    schedule_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'schedule_code'
    },
    route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'route_id',
        references: { model: 'srmss_route', key: 'route_id' }
    },
    bus_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'bus_id',
        references: { model: 'srmss_bus', key: 'bus_id' }
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'driver_id',
        references: { model: 'srmss_driver', key: 'driver_id' }
    },
    departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'departure_time'
    },
    arrival_time: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'arrival_time'
    },
    trip_type: {
        type: DataTypes.ENUM("regular", "express", "night", "special"),
        defaultValue: "regular",
        field: 'trip_type'
    },
    trip_status: {
        type: DataTypes.ENUM("scheduled", "on_time", "delayed", "in_progress", "completed", "cancelled"),
        defaultValue: "scheduled",
        field: 'trip_status'
    },
    delay_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'delay_minutes'
    },
    delay_reason: {
        type: DataTypes.TEXT,
        field: 'delay_reason'
    },
    actual_departure: {
        type: DataTypes.DATE,
        field: 'actual_departure'
    },
    actual_arrival: {
        type: DataTypes.DATE,
        field: 'actual_arrival'
    },
    passenger_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'passenger_count'
    },
    revenue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
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
    tableName: "srmss_schedule",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

Schedule.prototype.isDelayed = function() {
    return this.trip_status === "delayed";
};

Schedule.prototype.isCompleted = function() {
    return this.trip_status === "completed";
};

Schedule.prototype.getStatusColor = function() {
    const colors = {
        scheduled: "blue",
        on_time: "green",
        delayed: "orange",
        in_progress: "purple",
        completed: "darkgreen",
        cancelled: "red"
    };
    return colors[this.trip_status] || "gray";
};

module.exports = Schedule;