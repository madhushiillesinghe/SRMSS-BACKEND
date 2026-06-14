const mockConnection = {
    query: jest.fn().mockResolvedValue([[]]),
    execute: jest.fn().mockResolvedValue([[]]),
    end: jest.fn(),
    on: jest.fn(),
};

const mockPool = {
    getConnection: jest.fn().mockResolvedValue(mockConnection),
    query: jest.fn().mockResolvedValue([[]]),
    execute: jest.fn().mockResolvedValue([[]]),
    end: jest.fn(),
};

module.exports = {
    createConnection: jest.fn(() => mockConnection),
    createPool: jest.fn(() => mockPool),
};