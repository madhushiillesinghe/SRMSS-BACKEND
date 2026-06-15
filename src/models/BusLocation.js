const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BusLocation = sequelize.define("BusLocation", {
    location_id: {
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
        references: { model: 'srmss_schedule', key: 'schedule_id' }
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    speed: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'km/h'
    },
    heading: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'degrees'
    },
    accuracy: {
        type: DataTypes.DECIMAL(5, 2),
        comment: 'meters'
    },
    altitude: {
        type: DataTypes.DECIMAL(8, 2)
    },
    battery_level: {
        type: DataTypes.DECIMAL(3, 1)
    },
    status: {
        type: DataTypes.ENUM("active", "stopped", "offline"),
        defaultValue: "active"
    },
    next_stop_id: {
        type: DataTypes.INTEGER,
        field: 'next_stop_id',
        references: { model: 'srmss_route_stop', key: 'stop_id' }
    },
    estimated_arrival_to_next: {
        type: DataTypes.INTEGER,
        field: 'estimated_arrival_to_next',
        comment: 'minutes'
    },
    // ADD THESE MISSING FIELDS
    distance_traveled: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'distance_traveled',
        comment: 'km traveled from route start'
    },
    elapsed_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'elapsed_time',
        comment: 'minutes elapsed from departure'
    },
    recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'recorded_at'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: "srmss_bus_location",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    // Add only ESSENTIAL indexes (remove duplicates)
    indexes: [
        {
            name: 'idx_bus_time',
            fields: ['bus_id', 'recorded_at']
        },
        {
            name: 'idx_schedule',
            fields: ['schedule_id']
        }
    ]
});

// Helper method to calculate distance to another point
BusLocation.prototype.getDistanceTo = function(lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - this.latitude) * Math.PI / 180;
    const dLon = (lon2 - this.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Helper method to check if location is recent (within last 5 minutes)
BusLocation.prototype.isRecent = function() {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return new Date(this.recorded_at) > fiveMinutesAgo;
};

// Helper method to get status display text
BusLocation.prototype.getStatusText = function() {
    const statusMap = {
        active: '🟢 Active',
        stopped: '🟡 Stopped',
        offline: '⚫ Offline'
    };
    return statusMap[this.status] || 'Unknown';
};

module.exports = BusLocation;