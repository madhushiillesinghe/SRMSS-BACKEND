const TrackingService = require("../services/tracking.service");
const busRepository = require("../repositories/bus.repository");

const updateBusLocation = async (req, res, next) => {
    try {
        const { bus_id, latitude, longitude, speed, heading, accuracy, altitude, battery_level, schedule_id } = req.body;

        if (!bus_id || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "bus_id, latitude, and longitude are required"
            });
        }

        const location = await TrackingService.updateBusLocation({
            bus_id,
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
            altitude,
            battery_level,
            schedule_id,
            recorded_at: new Date()
        });

        res.json({
            success: true,
            message: "Bus location updated successfully",
            data: location
        });
    } catch (error) {
        if (error.message === "Bus not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getBusCurrentLocation = async (req, res, next) => {
    try {
        const { busId } = req.params;

        const bus = await busRepository.findById(busId);
        if (!bus) {
            return res.status(404).json({ success: false, message: "Bus not found" });
        }

        const location = await TrackingService.getBusCurrentLocation(busId);

        res.json({
            success: true,
            message: "Bus current location retrieved successfully",
            data: location
        });
    } catch (error) {
        if (error.message === "No location data found for this bus") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getAllActiveBusesLocations = async (req, res, next) => {
    try {
        const locations = await TrackingService.getAllActiveBusesLocations();

        res.json({
            success: true,
            message: "Active buses locations retrieved successfully",
            data: locations,
            count: locations.length
        });
    } catch (error) {
        next(error);
    }
};

const getBusRouteProgress = async (req, res, next) => {
    try {
        const { busId, scheduleId } = req.params;

        const bus = await busRepository.findById(busId);
        if (!bus) {
            return res.status(404).json({ success: false, message: "Bus not found" });
        }

        const progress = await TrackingService.getBusRouteProgress(busId, scheduleId);

        res.json({
            success: true,
            message: "Bus route progress retrieved successfully",
            data: progress
        });
    } catch (error) {
        if (error.message === "No route progress data found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getBusHistory = async (req, res, next) => {
    try {
        const { busId } = req.params;
        const { hours } = req.query;

        const bus = await busRepository.findById(busId);
        if (!bus) {
            return res.status(404).json({ success: false, message: "Bus not found" });
        }

        const history = await TrackingService.getBusHistory(busId, hours || 24);

        res.json({
            success: true,
            message: "Bus location history retrieved successfully",
            data: history
        });
    } catch (error) {
        next(error);
    }
};

const getBusLocationStats = async (req, res, next) => {
    try {
        const { busId } = req.params;
        const { days } = req.query;

        const bus = await busRepository.findById(busId);
        if (!bus) {
            return res.status(404).json({ success: false, message: "Bus not found" });
        }

        const history = await TrackingService.getBusHistory(busId, (days || 7) * 24);

        // Calculate additional statistics
        const locations = history.locations;
        let totalStoppedTime = 0;
        let totalMovingTime = 0;
        let lastLocation = null;

        for (const loc of locations) {
            if (lastLocation) {
                const timeDiff = new Date(loc.recorded_at) - new Date(lastLocation.recorded_at);
                if (loc.speed === 0) {
                    totalStoppedTime += timeDiff;
                } else {
                    totalMovingTime += timeDiff;
                }
            }
            lastLocation = loc;
        }

        res.json({
            success: true,
            message: "Bus location statistics retrieved successfully",
            data: {
                ...history.summary,
                stopped_time_minutes: Math.round(totalStoppedTime / 60000),
                moving_time_minutes: Math.round(totalMovingTime / 60000),
                active_percentage: history.locations.filter(l => l.speed > 0).length / history.locations.length * 100
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateBusLocation,
    getBusCurrentLocation,
    getAllActiveBusesLocations,
    getBusRouteProgress,
    getBusHistory,
    getBusLocationStats
};