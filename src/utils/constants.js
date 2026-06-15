/**
 * Constants for SRMSS Backend
 */

// User Roles
const USER_ROLES = {
    SUPER_ADMIN: "super_admin",
    DEPOT_MANAGER: "depot_manager",
    SCHEDULER: "scheduler",
    TICKET_OFFICER: "ticket_officer",
    DRIVER: "driver",
    VIEWER: "viewer"
};

// User Role Permissions
const ROLE_PERMISSIONS = {
    [USER_ROLES.SUPER_ADMIN]: {
        all: true
    },
    [USER_ROLES.DEPOT_MANAGER]: {
        routes: "full",
        schedules: "full",
        buses: "full",
        drivers: "full",
        tickets: "full",
        fuel: "full",
        maintenance: "full",
        reports: "full",
        dashboard: "full"
    },
    [USER_ROLES.SCHEDULER]: {
        routes: "view",
        schedules: "full",
        buses: "view",
        drivers: "view"
    },
    [USER_ROLES.TICKET_OFFICER]: {
        schedules: "view",
        tickets: "full"
    },
    [USER_ROLES.DRIVER]: {
        schedules: "assigned",
        tracking: "update",
        fuel: "log"
    },
    [USER_ROLES.VIEWER]: {
        dashboard: "view",
        reports: "view"
    }
};

// Bus Status
const BUS_STATUS = {
    AVAILABLE: "available",
    ON_ROUTE: "on_route",
    MAINTENANCE: "maintenance",
    INACTIVE: "inactive"
};

// Bus Types
const BUS_TYPES = {
    AC: "AC",
    NON_AC: "Non-AC",
    LUXURY: "Luxury",
    SEMI_LUXURY: "Semi-Luxury"
};

// Fuel Types
const FUEL_TYPES = {
    DIESEL: "Diesel",
    PETROL: "Petrol",
    ELECTRIC: "Electric",
    CNG: "CNG"
};

// Driver Status
const DRIVER_STATUS = {
    AVAILABLE: "available",
    ON_DUTY: "on_duty",
    OFF_DUTY: "off_duty",
    SUSPENDED: "suspended",
    TERMINATED: "terminated"
};

// Trip Status
const TRIP_STATUS = {
    SCHEDULED: "scheduled",
    ON_TIME: "on_time",
    DELAYED: "delayed",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
};

// Trip Types
const TRIP_TYPES = {
    REGULAR: "regular",
    EXPRESS: "express",
    NIGHT: "night",
    SPECIAL: "special"
};

// Booking Status
const BOOKING_STATUS = {
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    USED: "used",
    REFUNDED: "refunded"
};

// Payment Methods
const PAYMENT_METHODS = {
    CASH: "cash",
    CARD: "card",
    MOBILE_PAYMENT: "mobile_payment"
};

// Payment Status
const PAYMENT_STATUS = {
    PENDING: "pending",
    PAID: "paid",
    REFUNDED: "refunded"
};

// Maintenance Types
const MAINTENANCE_TYPES = {
    ROUTINE: "routine",
    CORRECTIVE: "corrective",
    EMERGENCY: "emergency",
    PREVENTIVE: "preventive"
};

// Maintenance Categories
const MAINTENANCE_CATEGORIES = {
    ENGINE: "engine",
    BRAKE: "brake",
    TIRE: "tire",
    ELECTRICAL: "electrical",
    BODY: "body",
    AC: "AC",
    OTHER: "other"
};

// Maintenance Status
const MAINTENANCE_STATUS = {
    SCHEDULED: "scheduled",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
};

// Route Status
const ROUTE_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended"
};

// Admin Status
const ADMIN_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended"
};

// Tracking Status
const TRACKING_STATUS = {
    ACTIVE: "active",
    STOPPED: "stopped",
    OFFLINE: "offline"
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Response Messages
const RESPONSE_MESSAGES = {
    // Success messages
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    TOKEN_REFRESHED: "Token refreshed successfully",
    PASSWORD_CHANGED: "Password changed successfully",
    CREATED: (entity) => `${entity} created successfully`,
    UPDATED: (entity) => `${entity} updated successfully`,
    DELETED: (entity) => `${entity} deleted successfully`,
    RETRIEVED: (entity) => `${entity} retrieved successfully`,

    // Error messages
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    NOT_FOUND: (entity) => `${entity} not found`,
    ALREADY_EXISTS: (entity) => `${entity} already exists`,
    INVALID_CREDENTIALS: "Invalid credentials",
    ACCOUNT_INACTIVE: "Account is inactive",
    TOKEN_EXPIRED: "Token has expired",
    INVALID_TOKEN: "Invalid token",
    VALIDATION_FAILED: "Validation failed",
    INTERNAL_ERROR: "Internal server error"
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Date formats
const DATE_FORMATS = {
    DATE: "YYYY-MM-DD",
    TIME: "HH:mm:ss",
    DATETIME: "YYYY-MM-DD HH:mm:ss",
    ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ"
};

// Time constants (in minutes)
const TIME_CONSTANTS = {
    MINUTE: 1,
    HOUR: 60,
    DAY: 1440,
    WEEK: 10080,
    MONTH: 43200
};

// Fare calculation defaults
const FARE_DEFAULTS = {
    BASE_FARE: 50,
    FARE_PER_KM: 1.5,
    MIN_FARE: 20
};

// Maintenance intervals (in km)
const MAINTENANCE_INTERVALS = {
    DEFAULT: 5000,
    ENGINE: 10000,
    OIL_CHANGE: 5000,
    BRAKE_CHECK: 10000,
    TIRE_ROTATION: 8000,
    AC_SERVICE: 15000
};

// File upload limits
const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/jpg"],
    ALLOWED_DOC_TYPES: ["application/pdf", "application/msword"]
};

// Cache TTL (in seconds)
const CACHE_TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 3600,       // 1 hour
    DAY: 86400        // 24 hours
};

// Rate limiting
const RATE_LIMITS = {
    DEFAULT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100
    },
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5
    },
    API: {
        windowMs: 60 * 1000, // 1 minute
        max: 30
    }
};

module.exports = {
    USER_ROLES,
    ROLE_PERMISSIONS,
    BUS_STATUS,
    BUS_TYPES,
    FUEL_TYPES,
    DRIVER_STATUS,
    TRIP_STATUS,
    TRIP_TYPES,
    BOOKING_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    MAINTENANCE_TYPES,
    MAINTENANCE_CATEGORIES,
    MAINTENANCE_STATUS,
    ROUTE_STATUS,
    ADMIN_STATUS,
    TRACKING_STATUS,
    HTTP_STATUS,
    RESPONSE_MESSAGES,
    PAGINATION,
    DATE_FORMATS,
    TIME_CONSTANTS,
    FARE_DEFAULTS,
    MAINTENANCE_INTERVALS,
    UPLOAD_LIMITS,
    CACHE_TTL,
    RATE_LIMITS
};