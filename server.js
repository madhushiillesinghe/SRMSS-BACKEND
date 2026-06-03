const app = require("./src/app");
const { sequelize, Admin } = require("./src/models");
require("dotenv").config();
const models = require("./src/models");
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully");

        await sequelize.sync();
        console.log(" Models synchronized");
        // Create default super admin
        await Admin.createDefaultAdmin();

        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}/api`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error(" Unable to start server:", error.message);
        process.exit(1);
    }
};

startServer();