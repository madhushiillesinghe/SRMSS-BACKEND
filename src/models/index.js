const sequelize = require("../config/db");
const Admin = require("./Admin");
const Route = require("./Route");
const RouteStop = require("./RouteStop");
const Bus = require("./Bus");
const Driver = require("./Driver");
const Schedule = require("./Schedule");
const Ticket = require("./Ticket");
const FuelLog = require("./FuelLog");
const MaintenanceLog = require("./MaintenanceLog");
const BusLocation = require("./BusLocation");

// Define all associations
const initModels = () => {
    // Admin has many Routes
    Admin.hasMany(Route, { foreignKey: "created_by" });
    Route.belongsTo(Admin, { foreignKey: "created_by" });

    // Route has many Stops
    Route.hasMany(RouteStop, { foreignKey: "route_id", as: "stops" });
    RouteStop.belongsTo(Route, { foreignKey: "route_id" });



    // Route has many Schedules
    Route.hasMany(Schedule, { foreignKey: "route_id" });
    Schedule.belongsTo(Route, { foreignKey: "route_id" });

    // Bus has many Schedules
    Bus.hasMany(Schedule, { foreignKey: "bus_id" });
    Schedule.belongsTo(Bus, { foreignKey: "bus_id" });

    // Driver has many Schedules
    Driver.hasMany(Schedule, { foreignKey: "driver_id" });
    Schedule.belongsTo(Driver, { foreignKey: "driver_id" });

    // Schedule has many Tickets
    Schedule.hasMany(Ticket, {
        foreignKey: "schedule_id",
        as: "tickets"
    });

    Ticket.belongsTo(Schedule, {
        foreignKey: "schedule_id",
        as: "schedule"
    });

    // RouteStop for Ticket relations
    RouteStop.hasMany(Ticket, { foreignKey: "from_stop_id", as: "fromTickets" });
    RouteStop.hasMany(Ticket, { foreignKey: "to_stop_id", as: "toTickets" });
    Ticket.belongsTo(RouteStop, { foreignKey: "from_stop_id", as: "fromStop" });
    Ticket.belongsTo(RouteStop, { foreignKey: "to_stop_id", as: "toStop" });

    // Bus has many FuelLogs
    Bus.hasMany(FuelLog, { foreignKey: "bus_id" });
    FuelLog.belongsTo(Bus, { foreignKey: "bus_id" });
    FuelLog.belongsTo(Schedule, {
        foreignKey: "schedule_id",
        as: "Schedule"
    });
    // Bus has many MaintenanceLogs
    Bus.hasMany(MaintenanceLog, { foreignKey: "bus_id" });
    MaintenanceLog.belongsTo(Bus, { foreignKey: "bus_id" });

    // Bus has many Locations
    Bus.hasMany(BusLocation, { foreignKey: "bus_id" });
    BusLocation.belongsTo(Bus, { foreignKey: "bus_id" });

    // Schedule has BusLocation
    Schedule.hasMany(BusLocation, { foreignKey: "schedule_id" });
    BusLocation.belongsTo(Schedule, { foreignKey: "schedule_id" });

    Bus.belongsTo(Route, {
        foreignKey: "assigned_route_id",
        as: "route"
    });

    Route.hasMany(Bus, {
        foreignKey: "assigned_route_id",
        as: "buses"
    });

    Driver.belongsTo(Route, {
        foreignKey: "assigned_route_id",
        as: "route"
    });

    Route.hasMany(Bus, {
        foreignKey: "assigned_route_id",
        as: "drivers"
    });

};

initModels();

module.exports = {
    sequelize,
    Admin,
    Route,
    RouteStop,
    Bus,
    Driver,
    Schedule,
    Ticket,
    FuelLog,
    MaintenanceLog,
    BusLocation
};