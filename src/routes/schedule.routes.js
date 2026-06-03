const express = require("express");
const {
    getAllSchedules,
    getScheduleById,
    getTodaySchedules,
    getUpcomingSchedules,
    createSchedule,
    updateSchedule,
    updateTripStatus,
    deleteSchedule,
    getScheduleStatistics,
    getDailyReport
} = require("../controllers/schedule.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/today", protect, getTodaySchedules);
router.get("/upcoming", protect, getUpcomingSchedules);
router.get("/statistics", protect, getScheduleStatistics);
router.get("/daily-report", protect, getDailyReport);
router.get("/", protect, getAllSchedules);
router.get("/:id", protect, getScheduleById);
router.post("/", protect, authorize("super_admin", "depot_manager", "scheduler"), createSchedule);
router.put("/:id", protect, authorize("super_admin", "depot_manager", "scheduler"), updateSchedule);
router.put("/:id/status", protect, updateTripStatus);
router.delete("/:id", protect, authorize("super_admin"), deleteSchedule);

module.exports = router;