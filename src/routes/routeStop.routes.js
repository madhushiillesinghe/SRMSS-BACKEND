const express = require("express");
const {
    getStopsByRoute,
    getStopById,
    createStop,
    bulkCreateStops,
    updateStop,
    deleteStop,
    reorderStops
} = require("../controllers/routeStop.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Public (with auth)
router.get("/route/:routeId", protect, getStopsByRoute);
router.get("/:id", protect, getStopById);

// Admin only
router.post("/", protect, authorize("super_admin", "depot_manager"), createStop);
router.post("/bulk", protect, authorize("super_admin", "depot_manager"), bulkCreateStops);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateStop);
router.put("/route/:routeId/reorder", protect, authorize("super_admin", "depot_manager"), reorderStops);
router.delete("/:id", protect, authorize("super_admin"), deleteStop);

module.exports = router;