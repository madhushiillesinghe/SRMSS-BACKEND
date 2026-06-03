const TicketService = require("../services/ticket.service");

const getAllTickets = async (req, res, next) => {
    try {
        const { status, schedule_id, travel_date, search } = req.query;
        const tickets = await TicketService.getAllTickets({ status, schedule_id, travel_date, search });

        res.json({
            success: true,
            message: "Tickets retrieved successfully",
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

const getTicketById = async (req, res, next) => {
    try {
        const ticket = await TicketService.getTicketById(req.params.id);

        res.json({
            success: true,
            message: "Ticket retrieved successfully",
            data: ticket
        });
    } catch (error) {
        if (error.message === "Ticket not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getTicketByNumber = async (req, res, next) => {
    try {
        const ticket = await TicketService.getTicketByNumber(req.params.number);

        res.json({
            success: true,
            message: "Ticket retrieved successfully",
            data: ticket
        });
    } catch (error) {
        if (error.message === "Ticket not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createTicket = async (req, res, next) => {
    try {
        const data = { ...req.body, booked_by: req.admin.id };

        const ticket = await TicketService.createTicket(data);

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: ticket
        });
    } catch (error) {
        if (error.message === "Seat already booked" || error.message === "Bus is full") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message.includes("not found")) {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const cancelTicket = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const ticket = await TicketService.cancelTicket(req.params.id, reason);

        res.json({
            success: true,
            message: "Ticket cancelled successfully",
            data: ticket
        });
    } catch (error) {
        if (error.message === "Ticket not found" || error.message === "Ticket cannot be cancelled") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === "Cannot cancel past travel tickets") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const markTicketUsed = async (req, res, next) => {
    try {
        const ticket = await TicketService.markTicketUsed(req.params.id);

        res.json({
            success: true,
            message: "Ticket marked as used",
            data: ticket
        });
    } catch (error) {
        if (error.message === "Ticket not found" || error.message === "Ticket cannot be used") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getTicketsBySchedule = async (req, res, next) => {
    try {
        const tickets = await TicketService.getTicketsBySchedule(req.params.scheduleId);

        res.json({
            success: true,
            message: "Tickets retrieved successfully",
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

const getOccupiedSeats = async (req, res, next) => {
    try {
        const seats = await TicketService.getOccupiedSeats(req.params.scheduleId);

        res.json({
            success: true,
            message: "Occupied seats retrieved successfully",
            data: { occupied_seats: seats, count: seats.length }
        });
    } catch (error) {
        next(error);
    }
};

const getTicketStatistics = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        console.log(start_date,end_date,"dates")
        const stats = await TicketService.getStatistics(start_date, end_date);

        res.json({
            success: true,
            message: "Ticket statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTickets,
    getTicketById,
    getTicketByNumber,
    createTicket,
    cancelTicket,
    markTicketUsed,
    getTicketsBySchedule,
    getOccupiedSeats,
    getTicketStatistics
};