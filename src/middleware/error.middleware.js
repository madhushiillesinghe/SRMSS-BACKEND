const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Sequelize errors
    if (err.name === "SequelizeValidationError") {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(", ");
    }

    if (err.name === "SequelizeUniqueConstraintError") {
        statusCode = 400;
        message = "Duplicate entry: " + err.errors.map(e => e.message).join(", ");
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
        statusCode = 400;
        message = "Related record not found";
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

module.exports = errorHandler;