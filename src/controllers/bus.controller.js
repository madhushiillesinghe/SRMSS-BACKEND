const BusService = require("../services/bus.service");

const getAllBuses = async (req, res, next) => {
    try {
        const { status, bus_type, fuel_type, search } = req.query;
        const buses = await BusService.getAllBuses({ status, bus_type, fuel_type, search });

        res.json({
            success: true,
            message: "Buses retrieved successfully",
            data: buses
        });
    } catch (error) {
        next(error);
    }
};

const getBusById = async (req, res, next) => {
    try {
        const bus = await BusService.getBusById(req.params.id);

        res.json({
            success: true,
            message: "Bus retrieved successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getBusByRegistration = async (req, res, next) => {
    try {
        const bus = await BusService.getBusByRegistration(req.params.regNumber);

        res.json({
            success: true,
            message: "Bus retrieved successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createBus = async (req, res, next) => {
    try {
        const data = { ...req.body, created_by: req.admin.id };
        const bus = await BusService.createBus(data);

        res.status(201).json({
            success: true,
            message: "Bus created successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Registration number already exists") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateBus = async (req, res, next) => {
    try {
        const bus = await BusService.updateBus(req.params.id, req.body);

        res.json({
            success: true,
            message: "Bus updated successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteBus = async (req, res, next) => {
    try {
        await BusService.deleteBus(req.params.id);

        res.json({
            success: true,
            message: "Bus deactivated successfully"
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getAvailableBuses = async (req, res, next) => {
    try {
        const buses = await BusService.getAvailableBuses();

        res.json({
            success: true,
            message: "Available buses retrieved successfully",
            data: buses
        });
    } catch (error) {
        next(error);
    }
};

const getBusesOnRoute = async (req, res, next) => {
    try {
        const buses = await BusService.getBusesOnRoute();

        res.json({
            success: true,
            message: "Buses on route retrieved successfully",
            data: buses
        });
    } catch (error) {
        next(error);
    }
};

const getBusesInMaintenance = async (req, res, next) => {
    try {
        const buses = await BusService.getBusesInMaintenance();

        res.json({
            success: true,
            message: "Buses in maintenance retrieved successfully",
            data: buses
        });
    } catch (error) {
        next(error);
    }
};

const getMaintenanceDueBuses = async (req, res, next) => {
    try {
        const buses = await BusService.getMaintenanceDueBuses();

        res.json({
            success: true,
            message: "Maintenance due buses retrieved successfully",
            data: buses
        });
    } catch (error) {
        next(error);
    }
};

const updateOdometer = async (req, res, next) => {
    try {
        const { odometer } = req.body;
        const bus = await BusService.updateOdometer(req.params.id, odometer);

        res.json({
            success: true,
            message: "Odometer updated successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes("cannot be less")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const assignRoute = async (req, res, next) => {
    try {
        const { routeId } = req.body;
        const bus = await BusService.assignRoute(req.params.id, routeId);

        res.json({
            success: true,
            message: "Route assigned to bus successfully",
            data: bus
        });
    } catch (error) {
        if (error.message === "Bus not found" || error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getBusStatistics = async (req, res, next) => {
    try {
        const stats = await BusService.getStatistics();

        res.json({
            success: true,
            message: "Bus statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
module.exports = {
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
};