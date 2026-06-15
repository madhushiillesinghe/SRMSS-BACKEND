const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const routes = require("./routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// ========== 1. CORS FIRST (so all routes inherit it) ==========
// For development, allow all origins without credentials
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // your frontend URLs
    credentials: false, // set to false if you don't need cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== 2. Other security (helmet after CORS) ==========
app.use(helmet());

// ========== 3. Rate limiting ==========
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP"
});
app.use("/api", limiter);

// ========== 4. Body parsers ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== 5. Routes ==========
app.use("/api/maps", require('./routes/maps.routes'));
app.use("/api", routes);

// ========== 6. Error handler ==========
app.use(errorHandler);

module.exports = app;