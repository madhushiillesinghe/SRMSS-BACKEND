// scripts/resetDb.js
const sequelize = require("../config/db");

const resetDatabase = async () => {
    try {
        console.log("🔄 Resetting database...");

        // Disable foreign key checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Get all tables
        const [tables] = await sequelize.query("SHOW TABLES");

        // Drop all tables
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`   Dropped: ${tableName}`);
        }

        // Enable foreign key checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ Database reset complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset failed:", error);
        process.exit(1);
    }
};

resetDatabase();