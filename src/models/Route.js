const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Route = sequelize.define("Route", {
    route_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    route_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'route_code'
    },
    route_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'route_name'
    },
    start_location: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'start_location'
    },
    end_location: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'end_location'
    },
    start_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        field: 'start_latitude'
    },
    start_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        field: 'start_longitude'
    },
    end_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        field: 'end_latitude'
    },
    end_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        field: 'end_longitude'
    },
    total_distance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_distance',
        comment: 'in kilometers'
    },
    estimated_duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'estimated_duration',
        comment: 'in minutes'
    },
    base_fare: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'base_fare'
    },
    fare_per_km: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 1.5,
        field: 'fare_per_km'
    },
    status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        defaultValue: "active"
    },
    description: {
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
    tableName: "srmss_route",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

Route.prototype.calculateFare = function(distance) {
    return Number(this.base_fare) + (distance * Number(this.fare_per_km));
};

module.exports = Route;