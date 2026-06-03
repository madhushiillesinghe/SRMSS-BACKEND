const RouteService = require("../services/route.service");

const getAllRoutes = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const routes = await RouteService.getAllRoutes({ status, search });

        res.json({
            success: true,
            message: "Routes retrieved successfully",
            data: routes
        });
    } catch (error) {
        next(error);
    }
};

const getRouteById = async (req, res, next) => {
    try {
        const route = await RouteService.getRouteById(req.params.id);

        res.json({
            success: true,
            message: "Route retrieved successfully",
            data: route
        });
    } catch (error) {
        if (error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getRouteByCode = async (req, res, next) => {
    try {
        const route = await RouteService.getRouteByCode(req.params.code);

        res.json({
            success: true,
            message: "Route retrieved successfully",
            data: route
        });
    } catch (error) {
        if (error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createRoute = async (req, res, next) => {
    try {
        const data = { ...req.body, created_by: req.admin.id };
        const route = await RouteService.createRoute(data);

        res.status(201).json({
            success: true,
            message: "Route created successfully",
            data: route
        });
    } catch (error) {
        if (error.message === "Route code already exists") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateRoute = async (req, res, next) => {
    try {
        const route = await RouteService.updateRoute(req.params.id, req.body);

        res.json({
            success: true,
            message: "Route updated successfully",
            data: route
        });
    } catch (error) {
        if (error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteRoute = async (req, res, next) => {
    try {
        await RouteService.deleteRoute(req.params.id);

        res.json({
            success: true,
            message: "Route deactivated successfully"
        });
    } catch (error) {
        if (error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getActiveRoutes = async (req, res, next) => {
    try {
        const routes = await RouteService.getActiveRoutes();

        res.json({
            success: true,
            message: "Active routes retrieved successfully",
            data: routes
        });
    } catch (error) {
        next(error);
    }
};

const getRouteWithStops = async (req, res, next) => {
    try {
        const route = await RouteService.getRouteWithStops(req.params.id);

        res.json({
            success: true,
            message: "Route with stops retrieved successfully",
            data: route
        });
    } catch (error) {
        if (error.message === "Route not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getRouteStatistics = async (req, res, next) => {
    try {
        const stats = await RouteService.getStatistics();

        res.json({
            success: true,
            message: "Route statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

const calculateFare = async (req, res, next) => {
    try {
        const { routeId, fromStopId, toStopId } = req.params;
        const fare = await RouteService.calculateFare(routeId, fromStopId, toStopId);

        res.json({
            success: true,
            message: "Fare calculated successfully",
            data: { fare }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRoutes,
    getRouteById,
    getRouteByCode,
    createRoute,
    updateRoute,
    deleteRoute,
    getActiveRoutes,
    getRouteWithStops,
    getRouteStatistics,
    calculateFare
};