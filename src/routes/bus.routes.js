const express = require("express");
const {
    getAllBuses,
    getBusById,
    getBusByRegistration,
    createBus,
    updateBus,
    deleteBus,
    getAvailableBuses,
    getBusesOnRoute,
    getBusesInMaintenance,
    getMaintenanceDueBuses,
    updateOdometer,
    assignRoute,
    getBusStatistics
} = require("../controllers/bus.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/available", protect, getAvailableBuses);
router.get("/on-route", protect, getBusesOnRoute);
router.get("/maintenance", protect, getBusesInMaintenance);
router.get("/maintenance-due", protect, getMaintenanceDueBuses);
router.get("/statistics", protect, getBusStatistics);
router.get("/registration/:regNumber", protect, getBusByRegistration);
router.get("/", protect, getAllBuses);
router.get("/:id", protect, getBusById);
router.post("/", protect, authorize("super_admin", "depot_manager"), createBus);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateBus);
router.put("/:id/odometer", protect, authorize("super_admin", "depot_manager"), updateOdometer);
router.put("/:id/assign-route", protect, authorize("super_admin", "depot_manager"), assignRoute);
router.delete("/:id", protect, authorize("super_admin"), deleteBus);

module.exports = router;