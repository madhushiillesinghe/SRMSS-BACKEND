const ticketRepository = require("../repositories/ticket.repository");
const scheduleRepository = require("../repositories/schedule.repository");
const routeStopRepository = require("../repositories/routeStop.repository");

class TicketService {
    static async getAllTickets(filters) {
        return await ticketRepository.findAll(filters);
    }

    static async getTicketById(id) {
        const ticket = await ticketRepository.findById(id);
        if (!ticket) throw new Error("Ticket not found");
        return ticket;
    }

    static async getTicketByNumber(ticketNumber) {
        const ticket = await ticketRepository.findByNumber(ticketNumber);
        if (!ticket) throw new Error("Ticket not found");
        return ticket;
    }

    static async createTicket(data) {
        // Validate schedule exists
        const schedule = await scheduleRepository.findById(data.schedule_id);
        console.log(schedule,"bus shedule")
        if (!schedule) throw new Error("Schedule not found");

        // Check if schedule is still active
        if (schedule.trip_status === "cancelled") throw new Error("Schedule is cancelled");
        if (schedule.trip_status === "completed") throw new Error("Schedule already completed");

        // Validate seat availability
        const occupiedSeats = await ticketRepository.getOccupiedSeats(data.schedule_id);
        if (occupiedSeats.includes(data.seat_number)) throw new Error("Seat already booked");

        // Check capacity
        if (occupiedSeats.length >= schedule.Bus.capacity) throw new Error("Bus is full");

        // Get stop names if not provided
        if (!data.from_stop_name) {
            const fromStop = await routeStopRepository.findById(data.from_stop_id);
            data.from_stop_name = fromStop.stop_name;
        }
        if (!data.to_stop_name) {
            const toStop = await routeStopRepository.findById(data.to_stop_id);
            data.to_stop_name = toStop.stop_name;
        }

        // Calculate fare if not provided

        if (!data.fare_amount) {
            const distance = Number(
                await routeStopRepository.calculateDistanceBetweenStops(
                    data.from_stop_id,
                    data.to_stop_id
                )
            );

            const baseFare = Number(schedule.Route.base_fare);
            const perKm = Number(schedule.Route.fare_per_km);

            data.fare_amount = Number((baseFare + distance * perKm).toFixed(2));
        }

        data.travel_date = new Date(schedule.departure_time);

        const ticket = await ticketRepository.create(data);

        // Update schedule passenger count and revenue
        const tickets = await ticketRepository.getTicketsBySchedule(data.schedule_id);
        await scheduleRepository.update(data.schedule_id, {
            passenger_count: tickets.length,
            revenue: tickets.reduce((sum, t) => sum + Number(t.fare_amount), 0)
        });

        return ticket;
    }

    static async cancelTicket(id, reason) {
        const ticket = await ticketRepository.findById(id);
        if (!ticket) throw new Error("Ticket not found");
        if (ticket.booking_status !== "confirmed") throw new Error("Ticket cannot be cancelled");

        const travelDate = new Date(ticket.travel_date);
        console.log(id,reason,"hbbhb")

        if (travelDate < new Date()) throw new Error("Cannot cancel past travel tickets");
        const cancelled = await ticketRepository.cancelTicket(id, reason);

        // Update schedule passenger count
        const tickets = await ticketRepository.getTicketsBySchedule(ticket.schedule_id);
        await scheduleRepository.update(ticket.schedule_id, {
            passenger_count: tickets.length,
            revenue: tickets.reduce((sum, t) => sum + Number(t.fare_amount), 0)
        });

        return cancelled;
    }

    static async markTicketUsed(id) {
        const ticket = await ticketRepository.findById(id);
        if (!ticket) throw new Error("Ticket not found");
        if (ticket.booking_status !== "confirmed") throw new Error("Ticket cannot be used");

        return await ticketRepository.updateStatus(id, "used");
    }

    static async getTicketsBySchedule(scheduleId) {
        return await ticketRepository.getTicketsBySchedule(scheduleId);
    }

    static async getOccupiedSeats(scheduleId) {
        return await ticketRepository.getOccupiedSeats(scheduleId);
    }

    static async getStatistics(startDate, endDate) {
        return await ticketRepository.getStatistics(startDate, endDate);
    }
}

module.exports = TicketService;