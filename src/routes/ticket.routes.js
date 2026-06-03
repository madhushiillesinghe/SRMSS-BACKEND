const express = require("express");
const {
    getAllTickets,
    getTicketById,
    getTicketByNumber,
    createTicket,
    cancelTicket,
    markTicketUsed,
    getTicketsBySchedule,
    getOccupiedSeats,
    getTicketStatistics
} = require("../controllers/ticket.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/statistics", protect, getTicketStatistics);
router.get("/schedule/:scheduleId/seats", protect, getOccupiedSeats);
router.get("/schedule/:scheduleId", protect, getTicketsBySchedule);
router.get("/number/:number", protect, getTicketByNumber);
router.get("/", protect, getAllTickets);
router.get("/:id", protect, getTicketById);
router.post("/", protect, authorize("super_admin", "depot_manager", "ticket_officer"), createTicket);
router.put("/:id/cancel", protect, authorize("super_admin", "depot_manager", "ticket_officer"), cancelTicket);
router.put("/:id/use", protect, authorize("super_admin", "depot_manager", "ticket_officer"), markTicketUsed);

module.exports = router;