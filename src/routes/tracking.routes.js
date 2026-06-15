const express = require("express");
const {
    updateBusLocation,
    getAllActiveBusesLocations,
    getBusRouteProgress,
    getBusHistory,
    getBusLocationStats,
    driverArrivedAtStop,
    getActiveBusesProgress,
    getBusCurrentLocation
} = require("../controllers/tracking.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const router = express.Router();
// Driver/Operator endpoints (for updating location)
router.post("/location", protect, authorize("super_admin", "depot_manager", "driver"), updateBusLocation);

// Public (with auth) - View endpoints
router.get("/active-buses", protect, getAllActiveBusesLocations);
router.get("/buses/:busId/current", getBusCurrentLocation);
router.get("/buses/:busId/progress/:scheduleId", protect, getBusRouteProgress);
router.get("/buses/:busId/history", protect, getBusHistory);
router.get("/buses/:busId/stats", protect, getBusLocationStats);
router.post("/arrive",protect,authorize("super_admin", "depot_manager", "driver"),driverArrivedAtStop);
router.get('/active-bus-schedules', protect,getBusRouteProgress);
router.get('/active-buses-progress', getActiveBusesProgress);
module.exports = router;