const SequelizeMock = jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue(true),
    define: jest.fn().mockReturnValue({}),
    sync: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([[]]),
    transaction: jest.fn().mockImplementation(async (cb) => {
        const t = { commit: jest.fn(), rollback: jest.fn() };
        return cb(t);
    }),
}));

SequelizeMock.Op = {
    gte: Symbol('gte'),
    lte: Symbol('lte'),
    between: Symbol('between'),
    like: Symbol('like'),
    in: Symbol('in'),
    ne: Symbol('ne'),
    or: Symbol('or'),
    and: Symbol('and'),
};

SequelizeMock.DataTypes = {
    INTEGER: 'INTEGER',
    STRING: 'STRING',
    DECIMAL: 'DECIMAL',
    DATE: 'DATE',
    DATEONLY: 'DATEONLY',
    TEXT: 'TEXT',
    ENUM: jest.fn(() => 'ENUM'),
    BOOLEAN: 'BOOLEAN',
    NOW: Symbol('now'),
};

module.exports = SequelizeMock;