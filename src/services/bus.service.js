const busRepository = require("../repositories/bus.repository");
const routeRepository = require("../repositories/route.repository");

class BusService {
    static async getAllBuses(filters) {
        return await busRepository.findAll(filters);
    }

    static async getBusById(id) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");
        return bus;
    }

    static async getBusByRegistration(regNumber) {
        const bus = await busRepository.findByRegistration(regNumber);
        if (!bus) throw new Error("Bus not found");
        return bus;
    }

    static async createBus(data) {
        const existing = await busRepository.findByRegistration(data.registration_number);
        if (existing) throw new Error("Registration number already exists");

        return await busRepository.create(data);
    }

    static async updateBus(id, data) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");

        if (data.registration_number && data.registration_number !== bus.registration_number) {
            const existing = await busRepository.findByRegistration(data.registration_number);
            if (existing) throw new Error("Registration number already exists");
        }

        return await busRepository.update(id, data);
    }

    static async deleteBus(id) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");

        return await busRepository.deleteBus(id);
    }

    static async getAvailableBuses() {
        return await busRepository.getAvailableBuses();
    }

    static async getBusesOnRoute() {
        return await busRepository.getBusesOnRoute();
    }

    static async getBusesInMaintenance() {
        return await busRepository.getBusesInMaintenance();
    }

    static async getMaintenanceDueBuses() {
        return await busRepository.getMaintenanceDueBuses();
    }

    static async updateOdometer(id, newOdometer) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");

        if (newOdometer < bus.current_odometer) {
            throw new Error("New odometer reading cannot be less than current");
        }

        const updated = await busRepository.updateBusOdometer(id, newOdometer);

        // Check if maintenance is due after odometer update
        if (updated.isMaintenanceDue()) {
            // Could trigger notification here
            console.log(`Bus ${updated.registration_number} is due for maintenance`);
        }

        return updated;
    }

    static async assignRoute(id, routeId) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");

        if (routeId) {
            const route = await routeRepository.findById(routeId);
            if (!route) throw new Error("Route not found");
        }

        return await busRepository.assignRoute(id, routeId);
    }

    static async getStatistics() {
        return await busRepository.getStatistics();
    }

    static async getBusWithDetails(id) {
        const bus = await busRepository.findById(id);
        if (!bus) throw new Error("Bus not found");

        // Get additional details
        const maintenanceHistory = await maintenanceRepository.getBusMaintenanceHistory(id);
        const fuelHistory = await fuelLogRepository.getBusFuelHistory(id, 30);

        return {
            ...bus.toJSON(),
            maintenance_history: maintenanceHistory,
            recent_fuel_logs: fuelHistory
        };
    }
}
module.exports = BusService;