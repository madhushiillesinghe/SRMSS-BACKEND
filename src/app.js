const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const routes = require("./routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP"
});
app.use("/api", limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

module.exports = app;