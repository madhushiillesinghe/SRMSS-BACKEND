const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ticket = sequelize.define("Ticket", {
    ticket_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ticket_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'ticket_number'
    },
    schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'schedule_id',
        references: { model: 'srmss_schedule', key: 'schedule_id' }
    },
    passenger_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'passenger_name'
    },
    passenger_nic: {
        type: DataTypes.STRING(20),
        field: 'passenger_nic'
    },
    passenger_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        field: 'passenger_phone'
    },
    seat_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'seat_number'
    },
    from_stop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'from_stop_id',
        references: { model: 'srmss_route_stop', key: 'stop_id' }
    },
    to_stop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'to_stop_id',
        references: { model: 'srmss_route_stop', key: 'stop_id' }
    },
    from_stop_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'from_stop_name'
    },
    to_stop_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'to_stop_name'
    },
    fare_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'fare_amount'
    },
    booking_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'booking_date'
    },
    travel_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'travel_date'
    },
    booking_status: {
        type: DataTypes.ENUM("confirmed", "cancelled", "used", "refunded"),
        defaultValue: "confirmed",
        field: 'booking_status'
    },
    payment_method: {
        type: DataTypes.ENUM("cash", "card", "mobile_payment"),
        defaultValue: "cash",
        field: 'payment_method'
    },
    payment_status: {
        type: DataTypes.ENUM("pending", "paid", "refunded"),
        defaultValue: "pending",
        field: 'payment_status'
    },
    payment_reference: {
        type: DataTypes.STRING(100),
        field: 'payment_reference'
    },
    booked_by: {
        type: DataTypes.INTEGER,
        field: 'booked_by',
        references: { model: 'srmss_admin', key: 'admin_id' }
    },
    cancelled_at: {
        type: DataTypes.DATE,
        field: 'cancelled_at'
    },
    cancellation_reason: {
        type: DataTypes.TEXT,
        field: 'cancellation_reason'
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
    tableName: "srmss_ticket",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: []
});

// Generate unique ticket number
Ticket.generateTicketNumber = async function() {
    const date = new Date();
    const prefix = `TKT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const lastTicket = await this.findOne({
        where: { ticket_number: { [Op.like]: `${prefix}%` } },
        order: [['ticket_number', 'DESC']]
    });

    let nextNum = 1;
    if (lastTicket) {
        const lastNum = parseInt(lastTicket.ticket_number.slice(-6));
        nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(6, '0')}`;
};

Ticket.prototype.isRefundable = function() {
    const travelDate = new Date(this.travel_date);
    const today = new Date();
    const daysDiff = (travelDate - today) / (1000 * 60 * 60 * 24);
    return daysDiff >= 1 && this.booking_status === "confirmed";
};

module.exports = Ticket;