// src/controllers/schedule.controller.js
const ScheduleService = require("../services/schedule.service");

const getAllSchedules = async (req, res, next) => {
    try {
        const { status, route_id, bus_id, driver_id, from_date, to_date } = req.query;
        const schedules = await ScheduleService.getAllSchedules({
            status, route_id, bus_id, driver_id, from_date, to_date
        });
        res.json({ success: true, data: schedules });
    } catch (error) { next(error); }
};

const getScheduleById = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.getScheduleById(req.params.id);
        res.json({ success: true, data: schedule });
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
        res.json({ success: true, data: schedules });
    } catch (error) { next(error); }
};

const getUpcomingSchedules = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const schedules = await ScheduleService.getUpcomingSchedules(limit || 10);
        res.json({ success: true, data: schedules });
    } catch (error) { next(error); }
};

const createSchedule = async (req, res, next) => {
    try {
        const data = { ...req.body, created_by: req.admin?.id || req.user?.id };
        const schedule = await ScheduleService.createSchedule(data);
        res.status(201).json({ success: true, message: "Schedule created", data: schedule });
    } catch (error) {
        if (error.message.includes("conflict") || error.message.includes("not available")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const createDailySchedule = async (req, res, next) => {
    try {
        const { routeId, busId, driverId, morningTime, eveningTime, tripType } = req.body;

        if (!routeId || !busId || !driverId || !morningTime || !eveningTime) {
            return res.status(400).json({
                success: false,
                message: "routeId, busId, driverId, morningTime, eveningTime are required"
            });
        }

        const schedules = await ScheduleService.createDailySchedule({
            routeId, busId, driverId, morningTime, eveningTime, tripType
        });

        res.status(201).json({
            success: true,
            message: "Morning and evening schedules created successfully",
            data: schedules
        });
    } catch (error) { next(error); }
};

const createMultiTripSchedule = async (req, res, next) => {
    try {
        const { routeId, busId, driverId, tripTimes, tripType } = req.body;

        if (!routeId || !busId || !driverId || !tripTimes || !Array.isArray(tripTimes) || tripTimes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "routeId, busId, driverId, and tripTimes array are required"
            });
        }

        const result = await ScheduleService.createMultiTripSchedule({
            routeId, busId, driverId, tripTimes, tripType
        });

        res.status(201).json({
            success: result.success,
            message: `${result.totalCreated} schedules created, ${result.totalFailed} failed`,
            data: result
        });
    } catch (error) { next(error); }
};

const createWeeklySchedule = async (req, res, next) => {
    try {
        const { routeId, busId, driverId, weekStartDate, tripTimes, tripType } = req.body;

        if (!routeId || !busId || !driverId || !weekStartDate || !tripTimes || !Array.isArray(tripTimes)) {
            return res.status(400).json({
                success: false,
                message: "routeId, busId, driverId, weekStartDate, and tripTimes array are required"
            });
        }

        const result = await ScheduleService.createWeeklySchedule({
            routeId, busId, driverId, weekStartDate, tripTimes, tripType
        });

        res.status(201).json({
            success: result.success,
            message: `${result.totalCreated} schedules created for the week, ${result.totalFailed} failed`,
            data: result
        });
    } catch (error) { next(error); }
};

const getBusDailySchedule = async (req, res, next) => {
    try {
        const { busId } = req.params;
        const { date } = req.query;

        const scheduleDate = date || new Date().toISOString().split('T')[0];
        const schedules = await ScheduleService.getBusDailySchedule(busId, scheduleDate);

        res.json({ success: true, data: schedules });
    } catch (error) { next(error); }
};

const getWeeklyScheduleSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const summary = await ScheduleService.getWeeklyScheduleSummary(startDate, endDate);

        res.json({ success: true, data: summary });
    } catch (error) { next(error); }
};

const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.updateSchedule(req.params.id, req.body);
        res.json({ success: true, message: "Schedule updated", data: schedule });
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
        const schedule = await ScheduleService.updateTripStatus(req.params.id, status, delay_minutes, delay_reason);
        res.json({ success: true, message: "Trip status updated", data: schedule });
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
        res.json({ success: true, message: "Schedule cancelled" });
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
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
};

const getDailyReport = async (req, res, next) => {
    try {
        const { date } = req.query;
        const report = await ScheduleService.getDailyReport(date || new Date().toISOString().split('T')[0]);
        res.json({ success: true, data: report });
    } catch (error) { next(error); }
};

module.exports = {
    getAllSchedules,
    getScheduleById,
    getTodaySchedules,
    getUpcomingSchedules,
    createSchedule,
    createDailySchedule,
    createMultiTripSchedule,
    createWeeklySchedule,
    getBusDailySchedule,
    getWeeklyScheduleSummary,
    updateSchedule,
    updateTripStatus,
    deleteSchedule,
    getScheduleStatistics,
    getDailyReport
};