const express = require("express");
const {
    getAllMaintenanceLogs,
    getMaintenanceLogById,
    createMaintenanceLog,
    updateMaintenanceLog,
    deleteMaintenanceLog,
    completeMaintenance,
    getUpcomingMaintenance,
    getBusMaintenanceHistory,
    getMaintenanceStatistics
} = require("../controllers/maintenance.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/upcoming", protect, getUpcomingMaintenance);
router.get("/statistics", protect, getMaintenanceStatistics);
router.get("/bus/:busId/history", protect, getBusMaintenanceHistory);
router.get("/", protect, getAllMaintenanceLogs);
router.get("/:id", protect, getMaintenanceLogById);
router.post("/", protect, authorize("super_admin", "depot_manager"), createMaintenanceLog);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateMaintenanceLog);
router.put("/:id/complete", protect, authorize("super_admin", "depot_manager"), completeMaintenance);
router.delete("/:id", protect, authorize("super_admin"), deleteMaintenanceLog);

module.exports = router;