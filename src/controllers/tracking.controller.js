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
    // src/controllers/tracking.controller.js

    const driverArrivedAtStop = async (req, res, next) => {
        try {
            const { schedule_id, stop_id } = req.body;

            if (!schedule_id || !stop_id) {
                return res.status(400).json({
                    success: false,
                    message: 'schedule_id and stop_id are required'
                });
            }

            // You may also check that the driver is assigned to this schedule,
            // or that the bus belongs to the driver. Add authorization as needed.

            const result = await TrackingService.driverArrivedAtStop(schedule_id, stop_id);

            res.json({
                success: true,
                message: 'Arrival recorded',
                data: result
            });
        } catch (error) {
            console.error('Error in driverArrivedAtStop:', error.message);
            if (error.message.includes('not found') || error.message.includes('does not belong')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            next(error);
        }
    };

// Don't forget to export the new function in module.exports
};
const driverArrivedAtStop = async (req, res, next) => {
    try {
        const { bus_id, schedule_id, stop_id } = req.body;
        if (!bus_id || !schedule_id || !stop_id) {
            return res.status(400).json({ success: false, message: 'bus_id, schedule_id, stop_id are required' });
        }

        // Get schedule with route stops
        const schedule = await scheduleRepository.getScheduleWithStops(schedule_id);
        if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

        const stops = schedule.Route.stops.sort((a,b) => a.stop_order - b.stop_order);
        const currentStopIndex = stops.findIndex(s => s.stop_id === stop_id);
        if (currentStopIndex === -1) return res.status(400).json({ success: false, message: 'Stop not found in route' });

        const nextStop = stops[currentStopIndex + 1] || null;
        const nextStopId = nextStop ? nextStop.stop_id : null;

        // Update schedule current/next stop
        await scheduleRepository.updateCurrentAndNextStop(schedule_id, stop_id, nextStopId);

        // Also update latest BusLocation record for this bus/schedule
        const latestLocation = await busLocationRepository.findLatestByBusId(bus_id);
        if (latestLocation && latestLocation.schedule_id === schedule_id) {
            await busLocationRepository.update(latestLocation.location_id, {
                next_stop_id: nextStopId,
                distance_traveled: (nextStop ? nextStop.distance_from_start : latestLocation.distance_traveled),
                estimated_arrival_to_next: null // will be recalculated by next GPS update
            });
        }

        res.json({ success: true, message: 'Arrival recorded', data: { current_stop_id: stop_id, next_stop_id: nextStopId } });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

module.exports = {
    updateBusLocation,
    getBusCurrentLocation,
    getAllActiveBusesLocations,
    getBusRouteProgress,
    getBusHistory,
    getBusLocationStats,
    driverArrivedAtStop
};