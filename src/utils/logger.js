/**
 * Logger utility for SRMSS Backend
 */

const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    ERROR: "ERROR",
    WARN: "WARN",
    INFO: "INFO",
    DEBUG: "DEBUG"
};

// Current log level (set via environment variable)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || "INFO";

// Log level priority
const LOG_PRIORITY = {
    [LOG_LEVELS.ERROR]: 0,
    [LOG_LEVELS.WARN]: 1,
    [LOG_LEVELS.INFO]: 2,
    [LOG_LEVELS.DEBUG]: 3
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };
    return JSON.stringify(logEntry);
};

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const writeToFile = (level, message, meta = {}) => {
    const logMessage = formatLogMessage(level, message, meta);
    const date = new Date();
    const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
    const filePath = path.join(logsDir, fileName);

    fs.appendFileSync(filePath, logMessage + "\n");
};

/**
 * Write to console
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const writeToConsole = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";

    switch(level) {
        case LOG_LEVELS.ERROR:
            console.error(`[${timestamp}] ERROR: ${message}${metaStr}`);
            break;
        case LOG_LEVELS.WARN:
            console.warn(`[${timestamp}] WARN: ${message}${metaStr}`);
            break;
        case LOG_LEVELS.INFO:
            console.info(`[${timestamp}] INFO: ${message}${metaStr}`);
            break;
        case LOG_LEVELS.DEBUG:
            console.debug(`[${timestamp}] DEBUG: ${message}${metaStr}`);
            break;
        default:
            console.log(`[${timestamp}] ${level}: ${message}${metaStr}`);
    }
};

/**
 * Main log function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const log = (level, message, meta = {}) => {
    if (LOG_PRIORITY[level] <= LOG_PRIORITY[CURRENT_LOG_LEVEL]) {
        writeToConsole(level, message, meta);

        // Always write errors to file
        if (level === LOG_LEVELS.ERROR || process.env.LOG_TO_FILE === "true") {
            writeToFile(level, message, meta);
        }
    }
};

/**
 * Error log
 * @param {string} message - Error message
 * @param {Object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
    log(LOG_LEVELS.ERROR, message, meta);
};

/**
 * Warning log
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
    log(LOG_LEVELS.WARN, message, meta);
};

/**
 * Info log
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
    log(LOG_LEVELS.INFO, message, meta);
};

/**
 * Debug log
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
    log(LOG_LEVELS.DEBUG, message, meta);
};

/**
 * Request logger middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get("User-Agent")
        };

        if (res.statusCode >= 400) {
            warn(`${req.method} ${req.url} - ${res.statusCode}`, logData);
        } else {
            info(`${req.method} ${req.url} - ${res.statusCode}`, logData);
        }
    });

    next();
};

/**
 * Error logger middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware
 */
const errorLogger = (err, req, res, next) => {
    const logData = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        stack: err.stack
    };

    error(err.message, logData);
    next(err);
};

/**
 * API call logger
 * @param {string} service - Service name
 * @param {string} endpoint - API endpoint
 * @param {Object} request - Request data
 * @param {Object} response - Response data
 * @param {number} duration - Duration in ms
 */
const apiCallLogger = (service, endpoint, request, response, duration) => {
    const logData = {
        service,
        endpoint,
        request,
        response,
        duration: `${duration}ms`
    };
    debug(`API Call to ${service} - ${endpoint}`, logData);
};

/**
 * Database query logger
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {number} duration - Duration in ms
 */
const dbQueryLogger = (query, params, duration) => {
    if (process.env.DEBUG_DB === "true") {
        const logData = {
            query: query.replace(/\s+/g, " ").trim(),
            params,
            duration: `${duration}ms`
        };
        debug("Database Query", logData);
    }
};

module.exports = {
    LOG_LEVELS,
    error,
    warn,
    info,
    debug,
    requestLogger,
    errorLogger,
    apiCallLogger,
    dbQueryLogger
};