// config/db.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

// First, connect without database to create it
const setupDatabase = async () => {
    const sequelizeWithoutDb = new Sequelize(
        "", // No database
        process.env.DB_USER || "root",
        process.env.DB_PASSWORD || "",
        {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 3306,
            dialect: "mysql",
            logging: false
        }
    );

    try {
        // Create database if it doesn't exist
        await sequelizeWithoutDb.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "srmss_transport"};`);
        console.log(`Database "${process.env.DB_NAME}" created or already exists`);
    } catch (error) {
        console.error("Error creating database:", error);
    } finally {
        await sequelizeWithoutDb.close();
    }
};

// Main connection with database
const sequelize = new Sequelize(
    process.env.DB_NAME || "srmss_transport",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Run setup and export
const initDb = async () => {
    await setupDatabase();
    return sequelize;
};

module.exports = sequelize;
module.exports.initDb = initDb;