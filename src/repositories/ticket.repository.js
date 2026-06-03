const { Ticket, Schedule, RouteStop, sequelize,Route } = require("../models");
const { Op } = require("sequelize");

const findAll = async (filters = {}) => {
    const where = {};
    if (filters.status) where.booking_status = filters.status;
    if (filters.schedule_id) where.schedule_id = filters.schedule_id;
    if (filters.travel_date) where.travel_date = filters.travel_date;
    if (filters.search) {
        where[Op.or] = [
            { ticket_number: { [Op.like]: `%${filters.search}%` } },
            { passenger_name: { [Op.like]: `%${filters.search}%` } },
            { passenger_phone: { [Op.like]: `%${filters.search}%` } }
        ];
    }

    return await Ticket.findAll({
        where,
        include: [
            { model: Schedule, as: "schedule", include: [{ model: Route, as: "Route" }] },
            { model: RouteStop, as: "fromStop" },
            { model: RouteStop, as: "toStop" }
        ],
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Ticket.findByPk(id, {
        include: [
            { model: Schedule, as: "schedule" },
            { model: RouteStop, as: "fromStop" },
            { model: RouteStop, as: "toStop" }
        ]
    });
};

const findByNumber = async (ticketNumber) => {
    return await Ticket.findOne({ where: { ticket_number: ticketNumber } });
};

const create = async (data) => {
    // Generate ticket number
    const date = new Date();
    const prefix = `TKT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const lastTicket = await Ticket.findOne({
        where: { ticket_number: { [Op.like]: `${prefix}%` } },
        order: [['ticket_number', 'DESC']]
    });

    let nextNum = 1;
    if (lastTicket) {
        const lastNum = parseInt(lastTicket.ticket_number.slice(-6));
        nextNum = lastNum + 1;
    }
    data.ticket_number = `${prefix}${String(nextNum).padStart(6, '0')}`;

    return await Ticket.create(data);
};

const update = async (id, data) => {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return null;
    return await ticket.update(data);
};

const updateStatus = async (id, status, cancellationReason = null) => {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return null;

    const updateData = { booking_status: status };
    if (status === "cancelled") {
        updateData.cancelled_at = new Date();
        updateData.cancellation_reason = cancellationReason;
        updateData.payment_status = "refunded";
    }
    if (status === "used") {
        updateData.payment_status = "paid";
    }

    return await ticket.update(updateData);
};

const getTicketsBySchedule = async (scheduleId) => {
    return await Ticket.findAll({
        where: { schedule_id: scheduleId, booking_status: "confirmed" },
        order: [["seat_number", "ASC"]]
    });
};

const getOccupiedSeats = async (scheduleId) => {
    const tickets = await Ticket.findAll({
        where: { schedule_id: scheduleId, booking_status: "confirmed" },
        attributes: ["seat_number"]
    });
    return tickets.map(t => t.seat_number);
};

const cancelTicket = async (id, reason) => {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return null;

    return await ticket.update({
        booking_status: "cancelled",
        cancelled_at: new Date(),
        cancellation_reason: reason,
        payment_status: "refunded"
    });
};

const getStatistics = async (startDate, endDate) => {

    if (!startDate || !endDate) {
        return {
            success: false,
            message: "startDate and endDate are required",
            data: null
        };
    }

    const [result] = await sequelize.query(`
        SELECT
            COUNT(*) as total_tickets,
            SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN booking_status = 'used' THEN 1 ELSE 0 END) as used,
            SUM(CASE WHEN payment_status = 'paid' THEN fare_amount ELSE 0 END) as total_revenue,
            AVG(fare_amount) as avg_fare,
            SUM(CASE WHEN payment_method = 'cash' THEN fare_amount ELSE 0 END) as cash_revenue,
            SUM(CASE WHEN payment_method = 'card' THEN fare_amount ELSE 0 END) as card_revenue,
            SUM(CASE WHEN payment_method = 'mobile_payment' THEN fare_amount ELSE 0 END) as mobile_revenue
        FROM srmss_ticket
        WHERE created_at BETWEEN :startDate AND :endDate
    `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
    });

    const stats = result || {};

    const hasData = stats.total_tickets > 0;

    return {
        success: hasData,
        message: hasData
            ? "Ticket statistics retrieved successfully"
            : "No ticket data found for selected date range",
        data: hasData ? stats : null
    };
};module.exports = {
    findAll,
    findById,
    findByNumber,
    create,
    update,
    updateStatus,
    getTicketsBySchedule,
    getOccupiedSeats,
    cancelTicket,
    getStatistics
};