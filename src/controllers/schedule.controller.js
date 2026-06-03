const ScheduleService = require("../services/schedule.service");

const getAllSchedules = async (req, res, next) => {
    try {
        const { status, route_id, bus_id, driver_id, from_date, to_date } = req.query;
        const schedules = await ScheduleService.getAllSchedules({
            status, route_id, bus_id, driver_id, from_date, to_date
        });

        res.json({
            success: true,
            message: "Schedules retrieved successfully",
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

const getScheduleById = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.getScheduleById(req.params.id);

        res.json({
            success: true,
            message: "Schedule retrieved successfully",
            data: schedule
        });
    } catch (error) {
        if (error.message === "Schedule not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getTodaySchedules = async (req, res, next) => {
    try {
        const schedules = await ScheduleService.getTodaySchedules();

        res.json({
            success: true,
            message: "Today's schedules retrieved successfully",
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

const getUpcomingSchedules = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const schedules = await ScheduleService.getUpcomingSchedules(limit || 10);

        res.json({
            success: true,
            message: "Upcoming schedules retrieved successfully",
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

const createSchedule = async (req, res, next) => {
    try {
        const data = { ...req.body, created_by: req.admin.id };
        const schedule = await ScheduleService.createSchedule(data);

        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: schedule
        });
    } catch (error) {
        if (error.message.includes("not found") || error.message.includes("conflict")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.updateSchedule(req.params.id, req.body);

        res.json({
            success: true,
            message: "Schedule updated successfully",
            data: schedule
        });
    } catch (error) {
        if (error.message === "Schedule not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === "Schedule conflict detected") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateTripStatus = async (req, res, next) => {
    try {
        const { status, delay_minutes, delay_reason } = req.body;
        const schedule = await ScheduleService.updateTripStatus(
            req.params.id, status, delay_minutes, delay_reason
        );

        res.json({
            success: true,
            message: "Trip status updated successfully",
            data: schedule
        });
    } catch (error) {
        if (error.message === "Schedule not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        await ScheduleService.deleteSchedule(req.params.id);

        res.json({
            success: true,
            message: "Schedule cancelled successfully"
        });
    } catch (error) {
        if (error.message === "Schedule not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getScheduleStatistics = async (req, res, next) => {
    try {
        const stats = await ScheduleService.getStatistics();

        res.json({
            success: true,
            message: "Schedule statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

const getDailyReport = async (req, res, next) => {
    try {
        const { date } = req.query;
        const report = await ScheduleService.getDailyReport(date || new Date().toISOString().split('T')[0]);

        res.json({
            success: true,
            message: "Daily report retrieved successfully",
            data: report        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSchedules,
    getScheduleById,
    getTodaySchedules,
    getUpcomingSchedules,
    createSchedule,
    updateSchedule,
    updateTripStatus,
    deleteSchedule,
    getScheduleStatistics,
    getDailyReport
};