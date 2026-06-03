const DriverService = require("../services/driver.service");

const getAllDrivers = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const drivers = await DriverService.getAllDrivers({ status, search });

        res.json({
            success: true,
            message: "Drivers retrieved successfully",
            data: drivers
        });
    } catch (error) {
        next(error);
    }
};

const getDriverById = async (req, res, next) => {
    try {
        const driver = await DriverService.getDriverById(req.params.id);

        res.json({
            success: true,
            message: "Driver retrieved successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getDriverByCode = async (req, res, next) => {
    try {
        const driver = await DriverService.getDriverByCode(req.params.code);

        res.json({
            success: true,
            message: "Driver retrieved successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createDriver = async (req, res, next) => {
    try {
        const data = { ...req.body, created_by: req.admin.id };
        const driver = await DriverService.createDriver(data);

        res.status(201).json({
            success: true,
            message: "Driver created successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "License number already exists" || error.message === "NIC number already exists") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === "License expiry date must be in future") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateDriver = async (req, res, next) => {
    try {
        const driver = await DriverService.updateDriver(req.params.id, req.body);

        res.json({
            success: true,
            message: "Driver updated successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === "License expiry date must be in future") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteDriver = async (req, res, next) => {
    try {
        await DriverService.deleteDriver(req.params.id);

        res.json({
            success: true,
            message: "Driver terminated successfully"
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getActiveDrivers = async (req, res, next) => {
    try {
        const drivers = await DriverService.getActiveDrivers();

        res.json({
            success: true,
            message: "Active drivers retrieved successfully",
            data: drivers
        });
    } catch (error) {
        next(error);
    }
};

const getDriversOnDuty = async (req, res, next) => {
    try {
        const drivers = await DriverService.getDriversOnDuty();

        res.json({
            success: true,
            message: "Drivers on duty retrieved successfully",
            data: drivers
        });
    } catch (error) {
        next(error);
    }
};

const getExpiringLicenses = async (req, res, next) => {
    try {
        const { days } = req.query;
        const drivers = await DriverService.getExpiringLicenses(days || 30);

        res.json({
            success: true,
            message: "Expiring licenses retrieved successfully",
            data: drivers
        });
    } catch (error) {
        next(error);
    }
};

const updateWorkingHours = async (req, res, next) => {
    try {
        const { hours } = req.body;
        const driver = await DriverService.updateWorkingHours(req.params.id, hours);

        res.json({
            success: true,
            message: "Working hours updated successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes("cannot work more than")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateRating = async (req, res, next) => {
    try {
        const { rating } = req.body;
        const driver = await DriverService.updateRating(req.params.id, rating);

        res.json({
            success: true,
            message: "Driver rating updated successfully",
            data: driver
        });
    } catch (error) {
        if (error.message === "Driver not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getDriverStatistics = async (req, res, next) => {
    try {
        const stats = await DriverService.getStatistics();

        res.json({
            success: true,
            message: "Driver statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};