// src/controllers/report.controller.js
const ReportService = require("../services/report.service");
const PDFGenerator = require("../utils/pdfGenerator");
const ExcelGenerator = require("../utils/excelGenerator");

const getFuelReport = async (req, res, next) => {
    try {
        const { busId, startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const report = await ReportService.getFuelReport(busId, startDate, endDate);

        if (format === 'pdf') {
            const pdfBuffer = await PDFGenerator.generateFuelReport(report);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=fuel_report_${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        if (format === 'excel') {
            const excelBuffer = await ExcelGenerator.generateFuelReport(report);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=fuel_report_${Date.now()}.xlsx`);
            return res.send(excelBuffer);
        }

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

const getMaintenanceReport = async (req, res, next) => {
    try {
        const { busId, startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const report = await ReportService.getMaintenanceReport(busId, startDate, endDate);

        if (format === 'pdf') {
            const pdfBuffer = await PDFGenerator.generateMaintenanceReport(report);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=maintenance_report_${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

const getRevenueReport = async (req, res, next) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const report = await ReportService.getRevenueReport(startDate, endDate);

        if (format === 'pdf') {
            const pdfBuffer = await PDFGenerator.generateRevenueReport(report);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        if (format === 'excel') {
            const excelBuffer = await ExcelGenerator.generateRevenueReport(report);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${Date.now()}.xlsx`);
            return res.send(excelBuffer);
        }

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

const getOperationalReport = async (req, res, next) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const report = await ReportService.getOperationalReport(startDate, endDate);

        if (format === 'pdf') {
            const pdfBuffer = await PDFGenerator.generateOperationalReport(report);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=operational_report_${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        if (format === 'excel') {
            const excelBuffer = await ExcelGenerator.generateOperationalReport(report);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=operational_report_${Date.now()}.xlsx`);
            return res.send(excelBuffer);
        }

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

const getFleetUtilizationReport = async (req, res, next) => {
    try {
        const { format = 'json' } = req.query;
        const report = await ReportService.getFleetUtilizationReport();

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

const getDashboardReport = async (req, res, next) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        const report = await ReportService.getCompleteDashboardReport(startDate, endDate);

        res.json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFuelReport,
    getMaintenanceReport,
    getRevenueReport,
    getOperationalReport,
    getFleetUtilizationReport,
    getDashboardReport
};