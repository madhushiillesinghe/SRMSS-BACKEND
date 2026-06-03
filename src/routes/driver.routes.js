const express = require("express");
const {
    getAllDrivers,
    getDriverById,
    getDriverByCode,
    createDriver,
    updateDriver,
    deleteDriver,
    getActiveDrivers,
    getDriversOnDuty,
    getExpiringLicenses,
    updateWorkingHours,
    updateRating,
    getDriverStatistics
} = require("../controllers/driver.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/available", protect, getActiveDrivers);
router.get("/on-duty", protect, getDriversOnDuty);
router.get("/expiring-licenses", protect, getExpiringLicenses);
router.get("/statistics", protect, getDriverStatistics);
router.get("/code/:code", protect, getDriverByCode);
router.get("/", protect, getAllDrivers);
router.get("/:id", protect, getDriverById);
router.post("/", protect, authorize("super_admin", "depot_manager"), createDriver);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateDriver);
router.put("/:id/working-hours", protect, authorize("super_admin", "depot_manager"), updateWorkingHours);
router.put("/:id/rating", protect, authorize("super_admin", "depot_manager"), updateRating);
router.delete("/:id", protect, authorize("super_admin"), deleteDriver);

module.exports = router;