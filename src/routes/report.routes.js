// src/routes/report.routes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// All report routes require authentication
router.use(authenticate);

// Fuel Reports
router.get("/fuel", authorize("super_admin", "depot_manager"), reportController.getFuelReport);

// Maintenance Reports
router.get("/maintenance", authorize("super_admin", "depot_manager"), reportController.getMaintenanceReport);

// Revenue Reports
router.get("/revenue", authorize("super_admin", "depot_manager", "scheduler"), reportController.getRevenueReport);

// Operational Reports
router.get("/operational", authorize("super_admin", "depot_manager"), reportController.getOperationalReport);

// Fleet Utilization Reports
router.get("/fleet", authorize("super_admin", "depot_manager"), reportController.getFleetUtilizationReport);

// Complete Dashboard Report
router.get("/dashboard", authorize("super_admin", "depot_manager"), reportController.getDashboardReport);

module.exports = router;