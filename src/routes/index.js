const express = require("express");
const authRoutes = require("./auth.routes");
const routeRoutes = require("./route.routes");
const routeStopRoutes = require("./routeStop.routes");
const busRoutes = require("./bus.routes");
const driverRoutes = require("./driver.routes");
const scheduleRoutes = require("./schedule.routes");
const ticketRoutes = require("./ticket.routes");
const fuelLogRoutes = require("./fuelLog.routes");
const maintenanceRoutes = require("./maintenance.routes");
const trackingRoutes = require("./tracking.routes");
const dashboardRoutes = require("./dashboard.routes");
const reportRoutes = require("./report.routes");


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/routes", routeRoutes);
router.use("/route-stops", routeStopRoutes);
router.use("/buses", busRoutes);
router.use("/drivers", driverRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/tickets", ticketRoutes);
router.use("/fuel-logs", fuelLogRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/tracking", trackingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

// Health check
router.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date(),
        service: "SRMSS API",
        version: "1.0.0"
    });
});

module.exports = router;