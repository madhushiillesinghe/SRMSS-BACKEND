// src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {

    static async generateFuelReport(reportData) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Fuel Consumption Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
            doc.moveDown();

            // Period
            doc.fontSize(12).font('Helvetica-Bold').text('Report Period:');
            doc.fontSize(10).font('Helvetica').text(`${reportData.period.startDate} to ${reportData.period.endDate}`);
            doc.moveDown();

            // Bus Details
            if (reportData.bus) {
                doc.fontSize(12).font('Helvetica-Bold').text('Bus Details:');
                doc.fontSize(10).font('Helvetica')
                    .text(`Registration: ${reportData.bus.registration_number}`)
                    .text(`Model: ${reportData.bus.bus_model}`)
                    .text(`Fuel Type: ${reportData.bus.fuel_type}`);
                doc.moveDown();
            }

            // Summary Section
            doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
            doc.moveDown(0.5);

            const summary = reportData.summary;
            const summaryY = doc.y;

            doc.fontSize(10).font('Helvetica');
            doc.text(`Total Fuel Consumed: ${summary.totalFuelLiters} Liters`, 50, summaryY);
            doc.text(`Total Cost: LKR ${summary.totalCost}`, 250, summaryY);
            doc.text(`Average Cost/Liter: LKR ${summary.averageCostPerLiter}`, 450, summaryY);

            doc.text(`Average Efficiency: ${summary.averageEfficiency} km/L`, 50, summaryY + 20);
            doc.text(`Total Refuels: ${summary.totalRefuels}`, 250, summaryY + 20);

            doc.moveDown(2);

            // Daily Summary Table
            doc.fontSize(12).font('Helvetica-Bold').text('Daily Fuel Summary', { underline: true });
            doc.moveDown(0.5);

            // Table Header
            const tableTop = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Date', 50, tableTop);
            doc.text('Fuel (L)', 150, tableTop);
            doc.text('Cost (LKR)', 250, tableTop);
            doc.text('Location', 350, tableTop);

            doc.moveDown();
            doc.fontSize(9).font('Helvetica');

            let rowY = doc.y;
            Object.entries(reportData.dailySummary).slice(0, 20).forEach(([date, data]) => {
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }
                doc.text(date, 50, rowY);
                doc.text(data.fuelAmount.toFixed(2), 150, rowY);
                doc.text(data.cost.toFixed(2), 250, rowY);
                rowY += 20;
            });

            doc.end();
        });
    }

    static async generateRevenueReport(reportData) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Revenue Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
            doc.moveDown();

            // Period
            doc.fontSize(12).font('Helvetica-Bold').text(`Period: ${reportData.period.startDate} to ${reportData.period.endDate}`);
            doc.moveDown();

            // Summary Section
            doc.fontSize(14).font('Helvetica-Bold').text('Revenue Summary', { underline: true });
            doc.moveDown(0.5);

            const summary = reportData.summary;
            const startY = doc.y;

            doc.fontSize(11).font('Helvetica');
            doc.text(`💰 Total Revenue: LKR ${summary.totalRevenue}`, 50, startY);
            doc.text(`🎫 Total Tickets Sold: ${summary.totalTicketsSold}`, 250, startY);
            doc.text(`📊 Average Ticket Price: LKR ${summary.averageTicketPrice}`, 450, startY);

            doc.text(`📅 Total Bookings: ${summary.totalTicketsBooked}`, 50, startY + 25);
            doc.text(`❌ Cancellations: ${summary.totalCancelled}`, 250, startY + 25);
            doc.text(`📈 Cancellation Rate: ${summary.cancellationRate}%`, 450, startY + 25);

            doc.moveDown(3);

            // Top Routes
            doc.fontSize(12).font('Helvetica-Bold').text('Top Performing Routes', { underline: true });
            doc.moveDown(0.5);

            const routes = reportData.topRoutes;
            const routesY = doc.y;

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Route', 50, routesY);
            doc.text('Tickets Sold', 250, routesY);
            doc.text('Revenue (LKR)', 400, routesY);

            doc.moveDown();
            doc.fontSize(9).font('Helvetica');

            let rowY = doc.y;
            routes.forEach(route => {
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }
                doc.text(route.route_name, 50, rowY);
                doc.text(route.tickets_sold.toString(), 250, rowY);
                doc.text(route.revenue.toFixed(2), 400, rowY);
                rowY += 20;
            });

            doc.end();
        });
    }

    static async generateOperationalReport(reportData) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Operational Performance Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
            doc.moveDown();

            // Period
            doc.fontSize(12).font('Helvetica-Bold').text(`Period: ${reportData.period.startDate} to ${reportData.period.endDate}`);
            doc.moveDown();

            // Key Metrics
            doc.fontSize(14).font('Helvetica-Bold').text('Key Performance Indicators', { underline: true });
            doc.moveDown(0.5);

            const summary = reportData.summary;
            const startY = doc.y;

            doc.fontSize(10).font('Helvetica');
            doc.text(`🚌 Total Trips: ${summary.totalSchedules}`, 50, startY);
            doc.text(`✅ Completed: ${summary.completedTrips}`, 200, startY);
            doc.text(`⏰ On-Time Rate: ${summary.onTimeRate}%`, 350, startY);

            doc.text(`🚫 Delayed: ${summary.delayedTrips}`, 50, startY + 20);
            doc.text(`❌ Cancelled: ${summary.cancelledTrips}`, 200, startY + 20);
            doc.text(`📊 Avg Delay: ${summary.averageDelayMinutes} min`, 350, startY + 20);

            doc.text(`👥 Total Passengers: ${summary.totalPassengers}`, 50, startY + 40);
            doc.text(`💰 Total Revenue: LKR ${summary.totalRevenue}`, 200, startY + 40);
            doc.text(`📈 Avg Passengers/Trip: ${summary.averagePassengersPerTrip}`, 350, startY + 40);

            doc.moveDown(3);

            // Route Performance Table
            doc.fontSize(12).font('Helvetica-Bold').text('Route Performance', { underline: true });
            doc.moveDown(0.5);

            const routes = reportData.routePerformance.slice(0, 10);
            const routesY = doc.y;

            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Route', 40, routesY);
            doc.text('Trips', 180, routesY);
            doc.text('Completed', 230, routesY);
            doc.text('Occupancy', 290, routesY);
            doc.text('Revenue', 360, routesY);

            doc.moveDown();
            doc.fontSize(8).font('Helvetica');

            let rowY = doc.y;
            routes.forEach(route => {
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }
                doc.text((route.route_name || '-').substring(0, 25), 40, rowY);
                doc.text(route.total_trips?.toString() || '0', 180, rowY);
                doc.text(route.completed_trips?.toString() || '0', 230, rowY);
                doc.text(`${route.avg_occupancy || 0}%`, 290, rowY);
                doc.text((route.total_revenue || 0).toFixed(2), 360, rowY);
                rowY += 18;
            });

            doc.end();
        });
    }
}

module.exports = PDFGenerator;