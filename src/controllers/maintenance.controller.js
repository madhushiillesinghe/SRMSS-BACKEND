const MaintenanceService = require("../services/maintenance.service");

const getAllMaintenanceLogs = async (req, res, next) => {
    try {
        const { bus_id, status, type, category, from_date, to_date } = req.query;
        const logs = await MaintenanceService.getAllLogs({
            bus_id, status, type, category, from_date, to_date
        });

        res.json({
            success: true,
            message: "Maintenance logs retrieved successfully",
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

const getMaintenanceLogById = async (req, res, next) => {
    try {
        const log = await MaintenanceService.getLogById(req.params.id);

        res.json({
            success: true,
            message: "Maintenance log retrieved successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Maintenance log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createMaintenanceLog = async (req, res, next) => {
    try {
        const data = { ...req.body, performed_by: req.admin.id };
        const log = await MaintenanceService.createLog(data);

        res.status(201).json({
            success: true,
            message: "Maintenance log created successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateMaintenanceLog = async (req, res, next) => {
    try {
        const log = await MaintenanceService.updateLog(req.params.id, req.body);

        res.json({
            success: true,
            message: "Maintenance log updated successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Maintenance log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteMaintenanceLog = async (req, res, next) => {
    try {
        await MaintenanceService.deleteLog(req.params.id);

        res.json({
            success: true,
            message: "Maintenance log deleted successfully"
        });
    } catch (error) {
        if (error.message === "Maintenance log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const completeMaintenance = async (req, res, next) => {
    try {
        const log = await MaintenanceService.completeMaintenance(req.params.id, req.admin.id);

        res.json({
            success: true,
            message: "Maintenance completed successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Maintenance log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getUpcomingMaintenance = async (req, res, next) => {
    try {
        const { days } = req.query;
        const logs = await MaintenanceService.getUpcoming(days || 7);

        res.json({
            success: true,
            message: "Upcoming maintenance retrieved successfully",
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

const getBusMaintenanceHistory = async (req, res, next) => {
    try {
        const history = await MaintenanceService.getBusHistory(req.params.busId);

        res.json({
            success: true,
            message: "Bus maintenance history retrieved successfully",
            data: history
        });
    } catch (error) {
        next(error);
    }
};

const getMaintenanceStatistics = async (req, res, next) => {
    try {
        const { bus_id, days } = req.query;
        const stats = await MaintenanceService.getStatistics(bus_id, days || 90);

        res.json({
            success: true,
            message: "Maintenance statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllMaintenanceLogs,
    getMaintenanceLogById,
    createMaintenanceLog,
    updateMaintenanceLog,
    deleteMaintenanceLog,
    completeMaintenance,
    getUpcomingMaintenance,
    getBusMaintenanceHistory,
    getMaintenanceStatistics
};