const routeRepository = require("../repositories/route.repository");
const routeStopRepository = require("../repositories/routeStop.repository");

class RouteService {
    static async getAllRoutes(filters) {
        return await routeRepository.findAll(filters);
    }

    static async getRouteById(id) {
        const route = await routeRepository.findById(id);
        if (!route) throw new Error("Route not found");
        return route;
    }

    static async getRouteByCode(code) {
        const route = await routeRepository.findByCode(code);
        if (!route) throw new Error("Route not found");
        return route;
    }

    static async createRoute(data) {
        const existing = await routeRepository.findByCode(data.route_code);
        if (existing) throw new Error("Route code already exists");

        return await routeRepository.create(data);
    }

    static async updateRoute(id, data) {
        const route = await routeRepository.findById(id);
        if (!route) throw new Error("Route not found");

        return await routeRepository.update(id, data);
    }

    static async deleteRoute(id) {
        const route = await routeRepository.findById(id);
        if (!route) throw new Error("Route not found");

        return await routeRepository.deleteRoute(id);
    }

    static async getActiveRoutes() {
        return await routeRepository.getActiveRoutes();
    }

    static async getRouteWithStops(id) {
        const route = await routeRepository.getRouteWithStops(id);
        if (!route) throw new Error("Route not found");
        return route;
    }

    static async getStatistics() {
        return await routeRepository.getStatistics();
    }

    static async calculateFare(routeId, fromStopId, toStopId) {
        const route = await routeRepository.findById(routeId);
        if (!route) throw new Error("Route not found");

        const distance = await routeStopRepository.calculateDistanceBetweenStops(fromStopId, toStopId);
        return route.calculateFare(distance);
    }
}

module.exports = RouteService;