/**
 * Validation functions for SRMSS Backend
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Check validation results middleware
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Login validation rules
 */
const validateLogin = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isString().withMessage('Username must be a string')
        .trim(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isString().withMessage('Password must be a string')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    validateRequest
];

/**
 * Change password validation rules
 */
const validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
    validateRequest
];

/**
 * Route validation rules
 */
const validateRoute = [
    body('route_code')
        .notEmpty().withMessage('Route code is required')
        .isString().withMessage('Route code must be a string')
        .isLength({ max: 20 }).withMessage('Route code cannot exceed 20 characters')
        .trim(),
    body('route_name')
        .notEmpty().withMessage('Route name is required')
        .isString().withMessage('Route name must be a string')
        .isLength({ max: 100 }).withMessage('Route name cannot exceed 100 characters')
        .trim(),
    body('start_location')
        .notEmpty().withMessage('Start location is required')
        .isString().withMessage('Start location must be a string')
        .trim(),
    body('end_location')
        .notEmpty().withMessage('End location is required')
        .isString().withMessage('End location must be a string')
        .trim(),
    body('total_distance')
        .notEmpty().withMessage('Total distance is required')
        .isFloat({ min: 0 }).withMessage('Total distance must be a positive number'),
    body('estimated_duration')
        .notEmpty().withMessage('Estimated duration is required')
        .isInt({ min: 1 }).withMessage('Estimated duration must be a positive integer'),
    body('base_fare')
        .optional()
        .isFloat({ min: 0 }).withMessage('Base fare must be a positive number'),
    body('fare_per_km')
        .optional()
        .isFloat({ min: 0 }).withMessage('Fare per km must be a positive number'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status value'),
    validateRequest
];

/**
 * Route Stop validation rules
 */
const validateRouteStop = [
    body('route_id')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer'),
    body('stop_name')
        .notEmpty().withMessage('Stop name is required')
        .isString().withMessage('Stop name must be a string')
        .isLength({ max: 100 }).withMessage('Stop name cannot exceed 100 characters')
        .trim(),
    body('stop_order')
        .notEmpty().withMessage('Stop order is required')
        .isInt({ min: 1 }).withMessage('Stop order must be a positive integer'),
    body('distance_from_start')
        .notEmpty().withMessage('Distance from start is required')
        .isFloat({ min: 0 }).withMessage('Distance from start must be a positive number'),
    body('estimated_arrival_time')
        .optional()
        .isInt({ min: 0 }).withMessage('Estimated arrival time must be a positive integer'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    validateRequest
];

/**
 * Bus validation rules
 */
const validateBus = [
    body('registration_number')
        .notEmpty().withMessage('Registration number is required')
        .isString().withMessage('Registration number must be a string')
        .isLength({ max: 20 }).withMessage('Registration number cannot exceed 20 characters')
        .trim(),
    body('bus_model')
        .notEmpty().withMessage('Bus model is required')
        .isString().withMessage('Bus model must be a string')
        .isLength({ max: 50 }).withMessage('Bus model cannot exceed 50 characters')
        .trim(),
    body('capacity')
        .notEmpty().withMessage('Capacity is required')
        .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('bus_type')
        .optional()
        .isIn(['AC', 'Non-AC', 'Luxury', 'Semi-Luxury']).withMessage('Invalid bus type'),
    body('fuel_type')
        .notEmpty().withMessage('Fuel type is required')
        .isIn(['Diesel', 'Petrol', 'Electric', 'CNG']).withMessage('Invalid fuel type'),
    body('mileage')
        .optional()
        .isFloat({ min: 0 }).withMessage('Mileage must be a positive number'),
    body('status')
        .optional()
        .isIn(['available', 'on_route', 'maintenance', 'inactive']).withMessage('Invalid status'),
    validateRequest
];

/**
 * Driver validation rules
 */
const validateDriver = [
    body('first_name')
        .notEmpty().withMessage('First name is required')
        .isString().withMessage('First name must be a string')
        .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
        .trim(),
    body('last_name')
        .notEmpty().withMessage('Last name is required')
        .isString().withMessage('Last name must be a string')
        .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
        .trim(),
    body('phone')
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid Sri Lankan phone number'),
    body('license_number')
        .notEmpty().withMessage('License number is required')
        .isString().withMessage('License number must be a string')
        .isLength({ max: 20 }).withMessage('License number cannot exceed 20 characters')
        .trim(),
    body('license_expiry')
        .notEmpty().withMessage('License expiry date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom(value => new Date(value) > new Date())
        .withMessage('License expiry date must be in the future'),
    body('hire_date')
        .notEmpty().withMessage('Hire date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('status')
        .optional()
        .isIn(['available', 'on_duty', 'off_duty', 'suspended', 'terminated']).withMessage('Invalid status'),
    validateRequest
];

/**
 * Schedule validation rules
 */
const validateSchedule = [
    body('route_id')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer'),
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
    body('driver_id')
        .notEmpty().withMessage('Driver ID is required')
        .isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
    body('departure_time')
        .notEmpty().withMessage('Departure time is required')
        .isISO8601().withMessage('Invalid date format'),
    body('arrival_time')
        .notEmpty().withMessage('Arrival time is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value, { req }) => new Date(value) > new Date(req.body.departure_time))
        .withMessage('Arrival time must be after departure time'),
    body('trip_type')
        .optional()
        .isIn(['regular', 'express', 'night', 'special']).withMessage('Invalid trip type'),
    body('trip_status')
        .optional()
        .isIn(['scheduled', 'on_time', 'delayed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Invalid trip status'),
    validateRequest
];

/**
 * Ticket validation rules
 */
const validateTicket = [
    body('schedule_id')
        .notEmpty().withMessage('Schedule ID is required')
        .isInt({ min: 1 }).withMessage('Schedule ID must be a positive integer'),
    body('passenger_name')
        .notEmpty().withMessage('Passenger name is required')
        .isString().withMessage('Passenger name must be a string')
        .isLength({ max: 100 }).withMessage('Passenger name cannot exceed 100 characters')
        .trim(),
    body('passenger_phone')
        .notEmpty().withMessage('Passenger phone is required')
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid Sri Lankan phone number'),
    body('seat_number')
        .notEmpty().withMessage('Seat number is required')
        .isString().withMessage('Seat number must be a string')
        .isLength({ max: 10 }).withMessage('Seat number cannot exceed 10 characters'),
    body('from_stop_id')
        .notEmpty().withMessage('From stop ID is required')
        .isInt({ min: 1 }).withMessage('From stop ID must be a positive integer'),
    body('to_stop_id')
        .notEmpty().withMessage('To stop ID is required')
        .isInt({ min: 1 }).withMessage('To stop ID must be a positive integer')
        .custom((value, { req }) => value !== req.body.from_stop_id)
        .withMessage('From stop and to stop cannot be the same'),
    body('payment_method')
        .optional()
        .isIn(['cash', 'card', 'mobile_payment']).withMessage('Invalid payment method'),
    validateRequest
];

/**
 * Fuel Log validation rules
 */
const validateFuelLog = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
    body('fuel_date')
        .notEmpty().withMessage('Fuel date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('fuel_amount')
        .notEmpty().withMessage('Fuel amount is required')
        .isFloat({ min: 0.1 }).withMessage('Fuel amount must be a positive number'),
    body('cost_per_liter')
        .notEmpty().withMessage('Cost per liter is required')
        .isFloat({ min: 0 }).withMessage('Cost per liter must be a positive number'),
    body('odometer_reading')
        .notEmpty().withMessage('Odometer reading is required')
        .isFloat({ min: 0 }).withMessage('Odometer reading must be a positive number'),
    body('fuel_type')
        .optional()
        .isIn(['Diesel', 'Petrol', 'Electric', 'CNG']).withMessage('Invalid fuel type'),
    validateRequest
];

/**
 * Maintenance Log validation rules
 */
const validateMaintenanceLog = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
    body('maintenance_date')
        .notEmpty().withMessage('Maintenance date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('maintenance_type')
        .notEmpty().withMessage('Maintenance type is required')
        .isIn(['routine', 'corrective', 'emergency', 'preventive']).withMessage('Invalid maintenance type'),
    body('maintenance_category')
        .notEmpty().withMessage('Maintenance category is required')
        .isIn(['engine', 'brake', 'tire', 'electrical', 'body', 'AC', 'other'])
        .withMessage('Invalid maintenance category'),
    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string'),
    body('odometer_at_service')
        .notEmpty().withMessage('Odometer reading is required')
        .isFloat({ min: 0 }).withMessage('Odometer reading must be a positive number'),
    body('cost')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    validateRequest
];

/**
 * Tracking location validation rules
 */
const validateBusLocation = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('speed')
        .optional()
        .isFloat({ min: 0, max: 200 }).withMessage('Speed must be between 0 and 200 km/h'),
    body('heading')
        .optional()
        .isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360 degrees'),
    validateRequest
];

/**
 * Pagination query validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),
    validateRequest
];

/**
 * Date range query validation
 */
const validateDateRange = [
    query('from_date')
        .optional()
        .isISO8601().withMessage('Invalid from date format'),
    query('to_date')
        .optional()
        .isISO8601().withMessage('Invalid to date format')
        .custom((value, { req }) => {
            if (req.query.from_date && value && new Date(value) < new Date(req.query.from_date)) {
                throw new Error('To date must be after from date');
            }
            return true;
        }),
    validateRequest
];

/**
 * ID param validation
 */
const validateIdParam = [
    param('id')
        .notEmpty().withMessage('ID is required')
        .isInt({ min: 1 }).withMessage('ID must be a positive integer')
        .toInt(),
    validateRequest
];

/**
 * Bus ID param validation
 */
const validateBusIdParam = [
    param('busId')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    validateRequest
];

/**
 * Schedule ID param validation
 */
const validateScheduleIdParam = [
    param('scheduleId')
        .notEmpty().withMessage('Schedule ID is required')
        .isInt({ min: 1 }).withMessage('Schedule ID must be a positive integer')
        .toInt(),
    validateRequest
];

/**
 * Route ID param validation
 */
const validateRouteIdParam = [
    param('routeId')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer')
        .toInt(),
    validateRequest
];

/**
 * Driver ID param validation
 */
const validateDriverIdParam = [
    param('driverId')
        .notEmpty().withMessage('Driver ID is required')
        .isInt({ min: 1 }).withMessage('Driver ID must be a positive integer')
        .toInt(),
    validateRequest
];

module.exports = {
    validateRequest,
    validateLogin,
    validateChangePassword,
    validateRoute,
    validateRouteStop,
    validateBus,
    validateDriver,
    validateSchedule,
    validateTicket,
    validateFuelLog,
    validateMaintenanceLog,
    validateBusLocation,
    validatePagination,
    validateDateRange,
    validateIdParam,
    validateBusIdParam,
    validateScheduleIdParam,
    validateRouteIdParam,
    validateDriverIdParam
};