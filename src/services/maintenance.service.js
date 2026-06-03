const maintenanceRepository = require("../repositories/maintenance.repository");
const busRepository = require("../repositories/bus.repository");

class MaintenanceService {
    static async getAllLogs(filters) {
        return await maintenanceRepository.findAll(filters);
    }

    static async getLogById(id) {
        const log = await maintenanceRepository.findById(id);
        if (!log) throw new Error("Maintenance log not found");
        return log;
    }

    static async createLog(data) {
        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");

        const log = await maintenanceRepository.create(data);

        // Update bus status if needed
        if (data.maintenance_type === "emergency" || data.status === "in_progress") {
            await busRepository.update(data.bus_id, { status: "maintenance" });
        }

        return log;
    }

    static async updateLog(id, data) {
        const log = await maintenanceRepository.findById(id);
        if (!log) throw new Error("Maintenance log not found");

        return await maintenanceRepository.update(id, data);
    }

    static async deleteLog(id) {
        const log = await maintenanceRepository.findById(id);
        if (!log) throw new Error("Maintenance log not found");

        return await maintenanceRepository.deleteLog(id);
    }

    static async completeMaintenance(id, completedBy) {
        const log = await maintenanceRepository.findById(id);
        if (!log) throw new Error("Maintenance log not found");

        const completed = await maintenanceRepository.completeMaintenance(id, completedBy);

        // Update bus status back to available
        await busRepository.update(log.bus_id, { status: "available" });

        return completed;
    }

    static async getUpcoming(days) {
        return await maintenanceRepository.getUpcomingMaintenance(days);
    }

    static async getBusHistory(busId) {
        return await maintenanceRepository.getBusMaintenanceHistory(busId);
    }

    static async getStatistics(busId, days) {
        return await maintenanceRepository.getStatistics(busId, days);
    }
}

module.exports = MaintenanceService;