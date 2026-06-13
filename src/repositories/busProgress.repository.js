// busProgressRepository.js
const pool = require('../config/db'); // assume you export a pool or connection

class BusProgressRepository {

    async getCurrentAndNextStop(busId, scheduleId) {
        // Validate inputs
        if (!busId || !scheduleId) {
            throw new Error('busId and scheduleId are required');
        }

        // Use execute() instead of query() for parameterized statements
        const [rows] = await pool.execute(
            'SELECT current_stop_id, next_stop_id FROM bus_route_progress WHERE bus_id = ? AND schedule_id = ?',
            [busId, scheduleId]
        );
        return rows[0] || null;
    }

    async updateProgress(busId, scheduleId, currentStopId, nextStopId) {
        if (!busId || !scheduleId) throw new Error('Missing required IDs');

        await pool.execute(
            `INSERT INTO bus_route_progress (bus_id, schedule_id, current_stop_id, next_stop_id)
             VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                                      current_stop_id = VALUES(current_stop_id),
                                      next_stop_id = VALUES(next_stop_id),
                                      updated_at = CURRENT_TIMESTAMP`,
            [busId, scheduleId, currentStopId, nextStopId]
        );
    }
}

module.exports = new BusProgressRepository();