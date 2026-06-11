// src/routes/schedule.routes.js
const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// GET routes
router.get("/", authenticate, scheduleController.getAllSchedules);
router.get("/today", authenticate, scheduleController.getTodaySchedules);
router.get("/upcoming", authenticate, scheduleController.getUpcomingSchedules);
router.get("/statistics", authenticate, scheduleController.getScheduleStatistics);
router.get("/daily-report", authenticate, scheduleController.getDailyReport);
router.get("/weekly-summary", authenticate, scheduleController.getWeeklyScheduleSummary);
router.get("/bus/:busId/daily", authenticate, scheduleController.getBusDailySchedule);
router.get("/:id", authenticate, scheduleController.getScheduleById);

// POST routes - Create schedules
router.post("/", authenticate, authorize("super_admin", "depot_manager"), scheduleController.createSchedule);
router.post("/daily", authenticate, authorize("super_admin", "depot_manager"), scheduleController.createDailySchedule);
router.post("/multi-trip", authenticate, authorize("super_admin", "depot_manager"), scheduleController.createMultiTripSchedule);
router.post("/weekly", authenticate, authorize("super_admin", "depot_manager"), scheduleController.createWeeklySchedule);

// PUT routes - Update schedules
router.put("/:id", authenticate, authorize("super_admin", "depot_manager"), scheduleController.updateSchedule);
router.put("/:id/status", authenticate, scheduleController.updateTripStatus);

// DELETE routes
router.delete("/:id", authenticate, authorize("super_admin"), scheduleController.deleteSchedule);

module.exports = router;