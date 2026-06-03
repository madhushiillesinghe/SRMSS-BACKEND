const express = require("express");
const {
    getAllFuelLogs,
    getFuelLogById,
    createFuelLog,
    updateFuelLog,
    deleteFuelLog,
    getBusFuelHistory,
    getFuelStatistics,
    getFuelEfficiency
} = require("../controllers/fuelLog.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/statistics", protect, getFuelStatistics);
router.get("/efficiency", protect, getFuelEfficiency);
router.get("/bus/:busId/history", protect, getBusFuelHistory);
router.get("/", protect, getAllFuelLogs);
router.get("/:id", protect, getFuelLogById);
router.post("/", protect, authorize("super_admin", "depot_manager"), createFuelLog);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateFuelLog);
router.delete("/:id", protect, authorize("super_admin"), deleteFuelLog);

module.exports = router;