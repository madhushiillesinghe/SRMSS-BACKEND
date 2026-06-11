// src/utils/excelGenerator.js
const ExcelJS = require('exceljs');

class ExcelGenerator {

    static async generateFuelReport(reportData) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fuel Report');

        // Title
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'Fuel Consumption Report';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Metadata
        worksheet.addRow([]);
        worksheet.addRow(['Generated:', new Date(reportData.generatedAt).toLocaleString()]);
        worksheet.addRow(['Period:', `${reportData.period.startDate} to ${reportData.period.endDate}`]);
        worksheet.addRow([]);

        // Summary Section
        worksheet.addRow(['SUMMARY']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 12 };

        const summary = reportData.summary;
        worksheet.addRow(['Total Fuel (Liters)', summary.totalFuelLiters]);
        worksheet.addRow(['Total Cost (LKR)', summary.totalCost]);
        worksheet.addRow(['Average Cost/Liter (LKR)', summary.averageCostPerLiter]);
        worksheet.addRow(['Average Efficiency (km/L)', summary.averageEfficiency]);
        worksheet.addRow(['Total Refuels', summary.totalRefuels]);
        worksheet.addRow([]);

        // Daily Summary Table
        worksheet.addRow(['DAILY FUEL SUMMARY']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 12 };

        worksheet.addRow(['Date', 'Fuel (Liters)', 'Cost (LKR)', 'Location', 'Vendor']);

        Object.entries(reportData.dailySummary).forEach(([date, data]) => {
            worksheet.addRow([date, data.fuelAmount.toFixed(2), data.cost.toFixed(2), '', '']);
        });

        // Style the header row
        const headerRow = worksheet.getRow(worksheet.rowCount - Object.keys(reportData.dailySummary).length - 1);
        headerRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });

        // Auto-size columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell(cell => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) maxLength = cellLength;
            });
            column.width = maxLength + 2;
        });

        return await workbook.xlsx.writeBuffer();
    }

    static async generateRevenueReport(reportData) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        // Title
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'Revenue Report';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Metadata
        worksheet.addRow([]);
        worksheet.addRow(['Generated:', new Date(reportData.generatedAt).toLocaleString()]);
        worksheet.addRow(['Period:', `${reportData.period.startDate} to ${reportData.period.endDate}`]);
        worksheet.addRow([]);

        // Summary
        worksheet.addRow(['REVENUE SUMMARY']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 12 };

        const summary = reportData.summary;
        worksheet.addRow(['Total Revenue (LKR)', summary.totalRevenue]);
        worksheet.addRow(['Total Tickets Sold', summary.totalTicketsSold]);
        worksheet.addRow(['Average Ticket Price (LKR)', summary.averageTicketPrice]);
        worksheet.addRow(['Cancellation Rate (%)', summary.cancellationRate]);
        worksheet.addRow([]);

        // Payment Methods
        worksheet.addRow(['PAYMENT METHOD BREAKDOWN']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 12 };
        worksheet.addRow(['Method', 'Count', 'Revenue (LKR)']);

        Object.entries(reportData.byPaymentMethod).forEach(([method, data]) => {
            worksheet.addRow([method, data.count, data.revenue.toFixed(2)]);
        });
        worksheet.addRow([]);

        // Daily Revenue
        worksheet.addRow(['DAILY REVENUE']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 12 };
        worksheet.addRow(['Date', 'Tickets', 'Revenue (LKR)']);

        Object.entries(reportData.dailyRevenue).forEach(([date, data]) => {
            worksheet.addRow([date, data.tickets, data.revenue.toFixed(2)]);
        });

        // Auto-size columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell(cell => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) maxLength = cellLength;
            });
            column.width = maxLength + 2;
        });

        return await workbook.xlsx.writeBuffer();
    }

    static async generateOperationalReport(reportData) {
        const workbook = new ExcelJS.Workbook();

        // Route Performance Sheet
        const routeSheet = workbook.addWorksheet('Route Performance');
        routeSheet.addRow(['Route Performance Report']);
        routeSheet.getCell('A1').font = { bold: true, size: 14 };
        routeSheet.addRow([]);
        routeSheet.addRow(['Route Name', 'Total Trips', 'Completed', 'Delayed', 'Avg Occupancy %', 'Total Revenue']);

        reportData.routePerformance.forEach(route => {
            routeSheet.addRow([
                route.route_name,
                route.total_trips || 0,
                route.completed_trips || 0,
                route.delayed_trips || 0,
                route.avg_occupancy || 0,
                route.total_revenue?.toFixed(2) || 0
            ]);
        });

        // Driver Performance Sheet
        const driverSheet = workbook.addWorksheet('Driver Performance');
        driverSheet.addRow(['Driver Performance Report']);
        driverSheet.getCell('A1').font = { bold: true, size: 14 };
        driverSheet.addRow([]);
        driverSheet.addRow(['Driver Name', 'Rating', 'Total Trips', 'Completed', 'Delayed', 'Avg Delay (min)', 'Total Revenue']);

        reportData.driverPerformance.forEach(driver => {
            driverSheet.addRow([
                driver.driver_name,
                driver.rating,
                driver.total_trips || 0,
                driver.completed_trips || 0,
                driver.delayed_trips || 0,
                driver.avg_delay?.toFixed(1) || 0,
                driver.total_revenue?.toFixed(2) || 0
            ]);
        });

        // Bus Utilization Sheet
        const busSheet = workbook.addWorksheet('Bus Utilization');
        busSheet.addRow(['Bus Utilization Report']);
        busSheet.getCell('A1').font = { bold: true, size: 14 };
        busSheet.addRow([]);
        busSheet.addRow(['Registration', 'Model', 'Total Trips', 'Total Passengers', 'Avg Occupancy %', 'Total Revenue']);

        reportData.busUtilization.forEach(bus => {
            busSheet.addRow([
                bus.registration_number,
                bus.bus_model,
                bus.total_trips || 0,
                bus.total_passengers || 0,
                bus.avg_occupancy || 0,
                bus.total_revenue?.toFixed(2) || 0
            ]);
        });

        // Auto-size columns for all sheets
        [routeSheet, driverSheet, busSheet].forEach(sheet => {
            sheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell(cell => {
                    const cellLength = cell.value ? cell.value.toString().length : 0;
                    if (cellLength > maxLength) maxLength = cellLength;
                });
                column.width = Math.min(maxLength + 2, 40);
            });
        });

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = ExcelGenerator;