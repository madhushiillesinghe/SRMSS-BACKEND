const fuelLogRepository = require("../repositories/fuelLog.repository");
const busRepository = require("../repositories/bus.repository");

class FuelLogService {
    static async getAllLogs(filters) {
        return await fuelLogRepository.findAll(filters);
    }

    static async getLogById(id) {
        const log = await fuelLogRepository.findById(id);
        if (!log) throw new Error("Fuel log not found");
        return log;
    }

    static async createLog(data) {
        const bus = await busRepository.findById(data.bus_id);
        if (!bus) throw new Error("Bus not found");

        const log = await fuelLogRepository.create(data);

        // Update bus odometer
        if (data.odometer_reading) {
            await busRepository.updateBusOdometer(data.bus_id, data.odometer_reading);
        }

        return log;
    }

    static async updateLog(id, data) {
        const log = await fuelLogRepository.findById(id);
        if (!log) throw new Error("Fuel log not found");

        return await fuelLogRepository.update(id, data);
    }

    static async deleteLog(id) {
        const log = await fuelLogRepository.findById(id);
        if (!log) throw new Error("Fuel log not found");

        return await fuelLogRepository.deleteLog(id);
    }

    static async getBusHistory(busId, days) {
        return await fuelLogRepository.getBusFuelHistory(busId, days);
    }

    static async getStatistics(busId, days) {
        return await fuelLogRepository.getStatistics(busId, days);
    }

    static async getFuelEfficiency(busId, days) {
        return await fuelLogRepository.getFuelEfficiency(busId, days);
    }
}

module.exports = FuelLogService;