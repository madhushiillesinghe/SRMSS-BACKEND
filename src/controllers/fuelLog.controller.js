const FuelLogService = require("../services/fuelLog.service");

const getAllFuelLogs = async (req, res, next) => {
    try {
        const { bus_id, from_date, to_date } = req.query;
        const logs = await FuelLogService.getAllLogs({ bus_id, from_date, to_date });

        res.json({
            success: true,
            message: "Fuel logs retrieved successfully",
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

const getFuelLogById = async (req, res, next) => {
    try {
        const log = await FuelLogService.getLogById(req.params.id);

        res.json({
            success: true,
            message: "Fuel log retrieved successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Fuel log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createFuelLog = async (req, res, next) => {
    try {
        const data = { ...req.body, recorded_by: req.admin.id };
        const log = await FuelLogService.createLog(data);

        res.status(201).json({
            success: true,
            message: "Fuel log created successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateFuelLog = async (req, res, next) => {
    try {
        const log = await FuelLogService.updateLog(req.params.id, req.body);

        res.json({
            success: true,
            message: "Fuel log updated successfully",
            data: log
        });
    } catch (error) {
        if (error.message === "Fuel log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteFuelLog = async (req, res, next) => {
    try {
        await FuelLogService.deleteLog(req.params.id);

        res.json({
            success: true,
            message: "Fuel log deleted successfully"
        });
    } catch (error) {
        if (error.message === "Fuel log not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getBusFuelHistory = async (req, res, next) => {
    try {
        const { days } = req.query;
        const history = await FuelLogService.getBusHistory(req.params.busId, days || 30);

        res.json({
            success: true,
            message: "Bus fuel history retrieved successfully",
            data: history
        });
    } catch (error) {
        next(error);
    }
};

const getFuelStatistics = async (req, res, next) => {
    try {
        const { bus_id, days } = req.query;
        const stats = await FuelLogService.getStatistics(bus_id, days || 30);

        res.json({
            success: true,
            message: "Fuel statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

const getFuelEfficiency = async (req, res, next) => {
    try {
        const { bus_id, days } = req.query;

        if (!bus_id) throw new Error("Bus ID is required");

        const efficiency = await FuelLogService.getFuelEfficiency(
            bus_id,
            days || 30
        );

        res.json({
            success: true,
            message: "Fuel efficiency retrieved successfully",
            data: efficiency
        });

    } catch (error) {
        next(error);
    }
};
module.exports = {
    getAllFuelLogs,
    getFuelLogById,
    createFuelLog,
    updateFuelLog,
    deleteFuelLog,
    getBusFuelHistory,
    getFuelStatistics,
    getFuelEfficiency
};