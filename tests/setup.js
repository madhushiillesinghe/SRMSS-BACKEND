// tests/setup.js
process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.ORS_API_KEY = "test_ors_key";

// Mock console logs
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

// Mock the entire sequelize module
jest.mock('../src/config/db', () => {
    const SequelizeMock = require('sequelize-mock');
    const dbMock = new SequelizeMock();
    return dbMock;
});

// Mock all models to prevent real DB connection
jest.mock('../src/models', () => {
    const SequelizeMock = require('sequelize-mock');
    const dbMock = new SequelizeMock();

    // Create mock models
    const Admin = dbMock.define('Admin', {});
    const Route = dbMock.define('Route', {});
    const RouteStop = dbMock.define('RouteStop', {});
    const Bus = dbMock.define('Bus', {});
    const Driver = dbMock.define('Driver', {});
    const Schedule = dbMock.define('Schedule', {});
    const Ticket = dbMock.define('Ticket', {});
    const FuelLog = dbMock.define('FuelLog', {});
    const MaintenanceLog = dbMock.define('MaintenanceLog', {});
    const BusLocation = dbMock.define('BusLocation', {});

    return {
        sequelize: dbMock,
        Admin,
        Route,
        RouteStop,
        Bus,
        Driver,
        Schedule,
        Ticket,
        FuelLog,
        MaintenanceLog,
        BusLocation,
    };
});