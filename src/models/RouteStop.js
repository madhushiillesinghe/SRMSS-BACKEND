const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RouteStop = sequelize.define("RouteStop", {
    stop_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'route_id',
        references: { model: 'srmss_route', key: 'route_id' }
    },
    stop_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'stop_name'
    },
    stop_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'stop_order',
        comment: 'order in the route sequence'
    },
    distance_from_start: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'distance_from_start',
        comment: 'km from start location'
    },
    estimated_arrival_time: {
        type: DataTypes.INTEGER,
        field: 'estimated_arrival_time',
        comment: 'minutes from departure'
    },
    waiting_time: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        field: 'waiting_time',
        comment: 'minutes stop duration'
    },
    fare_to_next: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'fare_to_next'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8)
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: "srmss_route_stop",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: []
});

module.exports = RouteStop;