const routeStopRepository = require("../repositories/routeStop.repository");
const routeRepository = require("../repositories/route.repository");

const getStopsByRoute = async (req, res, next) => {
    try {
        const { routeId } = req.params;

        const route = await routeRepository.findById(routeId);
        if (!route) {
            return res.status(404).json({ success: false, message: "Route not found" });
        }

        const stops = await routeStopRepository.findByRouteId(routeId);

        res.json({
            success: true,
            message: "Route stops retrieved successfully",
            data: stops
        });
    } catch (error) {
        next(error);
    }
};

const getStopById = async (req, res, next) => {
    try {
        const stop = await routeStopRepository.findById(req.params.id);
        if (!stop) {
            return res.status(404).json({ success: false, message: "Stop not found" });
        }

        res.json({
            success: true,
            message: "Stop retrieved successfully",
            data: stop
        });
    } catch (error) {
        next(error);
    }
};

const createStop = async (req, res, next) => {
    try {
        const { route_id, stop_order } = req.body;

        // Check if route exists
        const route = await routeRepository.findById(route_id);
        if (!route) {
            return res.status(404).json({ success: false, message: "Route not found" });
        }

        // Check if stop order already exists for this route
        const existingStops = await routeStopRepository.findByRouteId(route_id);
        if (existingStops.some(s => s.stop_order === stop_order)) {
            return res.status(400).json({
                success: false,
                message: `Stop order ${stop_order} already exists for this route`
            });
        }

        const stop = await routeStopRepository.create(req.body);

        res.status(201).json({
            success: true,
            message: "Stop created successfully",
            data: stop
        });
    } catch (error) {
        next(error);
    }
};

const bulkCreateStops = async (req, res, next) => {
    try {
        const { route_id, stops } = req.body;

        const route = await routeRepository.findById(route_id);
        if (!route) {
            return res.status(404).json({ success: false, message: "Route not found" });
        }

        // Delete existing stops
        await routeStopRepository.deleteByRouteId(route_id);

        // Create new stops
        const stopsWithRouteId = stops.map(stop => ({ ...stop, route_id }));
        const createdStops = await routeStopRepository.bulkCreate(stopsWithRouteId);

        res.status(201).json({
            success: true,
            message: "Stops created successfully",
            data: createdStops
        });
    } catch (error) {
        next(error);
    }
};

const updateStop = async (req, res, next) => {
    try {
        const stop = await routeStopRepository.update(req.params.id, req.body);
        if (!stop) {
            return res.status(404).json({ success: false, message: "Stop not found" });
        }

        res.json({
            success: true,
            message: "Stop updated successfully",
            data: stop
        });
    } catch (error) {
        next(error);
    }
};

const deleteStop = async (req, res, next) => {
    try {
        const result = await routeStopRepository.deleteStop(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: "Stop not found" });
        }

        res.json({
            success: true,
            message: "Stop deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

const reorderStops = async (req, res, next) => {
    try {
        const { routeId } = req.params;
        const { stopOrders } = req.body; // Array of {stop_id, stop_order}

        const route = await routeRepository.findById(routeId);
        if (!route) {
            return res.status(404).json({ success: false, message: "Route not found" });
        }

        for (const item of stopOrders) {
            await routeStopRepository.update(item.stop_id, { stop_order: item.stop_order });
        }

        const updatedStops = await routeStopRepository.findByRouteId(routeId);

        res.json({
            success: true,
            message: "Stops reordered successfully",
            data: updatedStops
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStopsByRoute,
    getStopById,
    createStop,
    bulkCreateStops,
    updateStop,
    deleteStop,
    reorderStops
};