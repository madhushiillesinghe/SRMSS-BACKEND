const express = require("express");
const {
    getDashboardStats,
    getRoutePerformance,
    getDriverPerformance,
    getBusUtilizationReport
} = require("../controllers/dashboard.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All dashboard routes require authentication
router.get("/stats", protect, getDashboardStats);
router.get("/route-performance", protect, getRoutePerformance);
router.get("/driver-performance", protect, getDriverPerformance);
router.get("/bus-utilization", protect, getBusUtilizationReport);

module.exports = router;