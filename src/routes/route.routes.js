const express = require("express");
const {
    getAllRoutes,
    getRouteById,
    getRouteByCode,
    createRoute,
    updateRoute,
    deleteRoute,
    getActiveRoutes,
    getRouteWithStops,
    getRouteStatistics,
    calculateFare
} = require("../controllers/route.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Public (with auth) routes
router.get("/active", protect, getActiveRoutes);
router.get("/statistics", protect, getRouteStatistics);
router.get("/code/:code", protect, getRouteByCode);
router.get("/", protect, getAllRoutes);
router.get("/:id", protect, getRouteById);
router.get("/:id/stops", protect, getRouteWithStops);
router.get("/:routeId/fare/:fromStopId/:toStopId", protect, calculateFare);

// Protected routes (admin only)
router.post("/", protect, authorize("super_admin", "depot_manager"), createRoute);
router.put("/:id", protect, authorize("super_admin", "depot_manager"), updateRoute);
router.delete("/:id", protect, authorize("super_admin"), deleteRoute);

module.exports = router;