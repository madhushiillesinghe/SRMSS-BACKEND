const TicketService = require("../../../src/services/ticket.service");
const ticketRepository = require("../../../src/repositories/ticket.repository");
const scheduleRepository = require("../../../src/repositories/schedule.repository");
const routeStopRepository = require("../../../src/repositories/routeStop.repository");

jest.mock("../../../src/repositories/ticket.repository");
jest.mock("../../../src/repositories/schedule.repository");
jest.mock("../../../src/repositories/routeStop.repository");

describe("TicketService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("createTicket validates seat availability", async () => {
        // Mock schedule with Route containing base_fare and fare_per_km
        const mockSchedule = {
            schedule_id: 1,
            trip_status: "scheduled",
            Bus: { capacity: 40 },
            Route: {
                base_fare: 50,
                fare_per_km: 1.5,
                route_name: "Test Route"
            }
        };
        scheduleRepository.findById.mockResolvedValue(mockSchedule);

        // Mock occupied seats
        ticketRepository.getOccupiedSeats.mockResolvedValue(["A1"]);

        // Mock stops
        routeStopRepository.findById.mockResolvedValue({ stop_id: 1, stop_name: "StopA" });
        routeStopRepository.calculateDistanceBetweenStops.mockResolvedValue(10);

        // Mock tickets after creation (for passenger count update)
        ticketRepository.getTicketsBySchedule.mockResolvedValue([{ fare_amount: 100 }]);
        scheduleRepository.update.mockResolvedValue({});

        // Mock ticket creation
        const createdTicket = { ticket_id: 1, ticket_number: "TKT202406000001", seat_number: "A2" };
        ticketRepository.create.mockResolvedValue(createdTicket);

        const data = { schedule_id: 1, seat_number: "A2", from_stop_id: 1, to_stop_id: 2 };
        const result = await TicketService.createTicket(data);

        expect(result).toHaveProperty("ticket_number");
        expect(ticketRepository.create).toHaveBeenCalled();
        expect(scheduleRepository.update).toHaveBeenCalledWith(1, {
            passenger_count: 1,
            revenue: 100
        });
    });
});