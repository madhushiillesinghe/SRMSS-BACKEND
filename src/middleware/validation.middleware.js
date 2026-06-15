/**
 * Validation Middleware for SRMSS Backend
 * Handles request validation, sanitization, and custom validation rules
 */

const { body, param, query, validationResult } = require("express-validator");

// ============================================
// CORE VALIDATION MIDDLEWARE
// ============================================

/**
 * Check validation results and return errors if any
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: formattedErrors
        });
    }
    next();
};

/**
 * Validate ID parameter (positive integer)
 */
const validateIdParam = [
    param('id')
        .notEmpty().withMessage('ID is required')
        .isInt({ min: 1 }).withMessage('ID must be a positive integer')
        .toInt(),
    validateRequest
];

/**
 * Validate pagination query parameters
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
    query('sort_by')
        .optional()
        .isString().withMessage('Sort by must be a string')
        .trim(),
    query('sort_order')
        .optional()
        .isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
    validateRequest
];

/**
 * Validate date range query parameters
 */
const validateDateRange = [
    query('from_date')
        .optional()
        .isISO8601().withMessage('Invalid from date format')
        .toDate(),
    query('to_date')
        .optional()
        .isISO8601().withMessage('Invalid to date format')
        .toDate()
        .custom((value, { req }) => {
            if (req.query.from_date && value && new Date(value) < new Date(req.query.from_date)) {
                throw new Error('To date must be after from date');
            }
            return true;
        }),
    validateRequest
];

// ============================================
// AUTHENTICATION VALIDATION RULES
// ============================================

/**
 * Login validation rules
 */
const validateLogin = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isString().withMessage('Username must be a string')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
        .trim()
        .escape(),
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
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
    validateRequest
];

/**
 * Create admin validation rules
 */
const validateCreateAdmin = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isString().withMessage('Username must be a string')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
        .trim()
        .toLowerCase(),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name')
        .notEmpty().withMessage('Full name is required')
        .isString().withMessage('Full name must be a string')
        .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters')
        .trim(),
    body('phone')
        .optional()
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid Sri Lankan phone number'),
    body('role')
        .optional()
        .isIn(['super_admin', 'depot_manager', 'scheduler', 'ticket_officer', 'viewer'])
        .withMessage('Invalid role'),
    validateRequest
];

// ============================================
// ROUTE VALIDATION RULES
// ============================================

/**
 * Route validation rules
 */
const validateRoute = [
    body('route_code')
        .notEmpty().withMessage('Route code is required')
        .isString().withMessage('Route code must be a string')
        .isLength({ min: 2, max: 20 }).withMessage('Route code must be between 2 and 20 characters')
        .matches(/^[A-Z0-9-]+$/).withMessage('Route code can only contain uppercase letters, numbers, and hyphens')
        .trim()
        .toUpperCase(),
    body('route_name')
        .notEmpty().withMessage('Route name is required')
        .isString().withMessage('Route name must be a string')
        .isLength({ min: 3, max: 100 }).withMessage('Route name must be between 3 and 100 characters')
        .trim(),
    body('start_location')
        .notEmpty().withMessage('Start location is required')
        .isString().withMessage('Start location must be a string')
        .isLength({ max: 100 }).withMessage('Start location cannot exceed 100 characters')
        .trim(),
    body('end_location')
        .notEmpty().withMessage('End location is required')
        .isString().withMessage('End location must be a string')
        .isLength({ max: 100 }).withMessage('End location cannot exceed 100 characters')
        .trim(),
    body('start_latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('start_longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('end_latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('end_longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('total_distance')
        .notEmpty().withMessage('Total distance is required')
        .isFloat({ min: 0.1 }).withMessage('Total distance must be a positive number'),
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
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),
    validateRequest
];

/**
 * Route Stop validation rules
 */
const validateRouteStop = [
    body('route_id')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer')
        .toInt(),
    body('stop_name')
        .notEmpty().withMessage('Stop name is required')
        .isString().withMessage('Stop name must be a string')
        .isLength({ min: 2, max: 100 }).withMessage('Stop name must be between 2 and 100 characters')
        .trim(),
    body('stop_order')
        .notEmpty().withMessage('Stop order is required')
        .isInt({ min: 1 }).withMessage('Stop order must be a positive integer')
        .toInt(),
    body('distance_from_start')
        .notEmpty().withMessage('Distance from start is required')
        .isFloat({ min: 0 }).withMessage('Distance from start must be a positive number'),
    body('estimated_arrival_time')
        .optional()
        .isInt({ min: 0 }).withMessage('Estimated arrival time must be a positive integer')
        .toInt(),
    body('waiting_time')
        .optional()
        .isInt({ min: 0, max: 30 }).withMessage('Waiting time must be between 0 and 30 minutes')
        .toInt(),
    body('fare_to_next')
        .optional()
        .isFloat({ min: 0 }).withMessage('Fare to next must be a positive number'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    validateRequest
];

/**
 * Bulk create route stops validation
 */
const validateBulkRouteStops = [
    body('route_id')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer')
        .toInt(),
    body('stops')
        .isArray({ min: 2 }).withMessage('At least 2 stops are required for a route'),
    body('stops.*.stop_name')
        .notEmpty().withMessage('Stop name is required for all stops')
        .isString().withMessage('Stop name must be a string')
        .trim(),
    body('stops.*.stop_order')
        .notEmpty().withMessage('Stop order is required for all stops')
        .isInt({ min: 1 }).withMessage('Stop order must be a positive integer'),
    body('stops.*.distance_from_start')
        .notEmpty().withMessage('Distance from start is required for all stops')
        .isFloat({ min: 0 }).withMessage('Distance from start must be a positive number'),
    validateRequest
];

// ============================================
// BUS VALIDATION RULES
// ============================================

/**
 * Bus validation rules
 */
const validateBus = [
    body('registration_number')
        .notEmpty().withMessage('Registration number is required')
        .isString().withMessage('Registration number must be a string')
        .isLength({ min: 5, max: 20 }).withMessage('Registration number must be between 5 and 20 characters')
        .matches(/^[A-Z0-9-]+$/).withMessage('Registration number can only contain uppercase letters, numbers, and hyphens')
        .trim()
        .toUpperCase(),
    body('bus_model')
        .notEmpty().withMessage('Bus model is required')
        .isString().withMessage('Bus model must be a string')
        .isLength({ max: 50 }).withMessage('Bus model cannot exceed 50 characters')
        .trim(),
    body('capacity')
        .notEmpty().withMessage('Capacity is required')
        .isInt({ min: 10, max: 100 }).withMessage('Capacity must be between 10 and 100 seats'),
    body('bus_type')
        .optional()
        .isIn(['AC', 'Non-AC', 'Luxury', 'Semi-Luxury']).withMessage('Invalid bus type'),
    body('fuel_type')
        .notEmpty().withMessage('Fuel type is required')
        .isIn(['Diesel', 'Petrol', 'Electric', 'CNG']).withMessage('Invalid fuel type'),
    body('mileage')
        .optional()
        .isFloat({ min: 0, max: 20 }).withMessage('Mileage must be between 0 and 20 km/l'),
    body('current_odometer')
        .optional()
        .isFloat({ min: 0 }).withMessage('Current odometer must be a positive number'),
    body('manufacturing_year')
        .optional()
        .isInt({ min: 1990, max: new Date().getFullYear() }).withMessage('Invalid manufacturing year'),
    body('status')
        .optional()
        .isIn(['available', 'on_route', 'maintenance', 'inactive']).withMessage('Invalid status'),
    body('assigned_route_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Assigned route ID must be a positive integer')
        .toInt(),
    body('notes')
        .optional()
        .isString().withMessage('Notes must be a string')
        .trim(),
    validateRequest
];

/**
 * Update odometer validation
 */
const validateOdometerUpdate = [
    param('id')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    body('odometer')
        .notEmpty().withMessage('Odometer reading is required')
        .isFloat({ min: 0 }).withMessage('Odometer reading must be a positive number'),
    validateRequest
];

/**
 * Assign route to bus validation
 */
const validateAssignRoute = [
    param('id')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    body('routeId')
        .optional()
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer')
        .toInt(),
    validateRequest
];

// ============================================
// DRIVER VALIDATION RULES
// ============================================

/**
 * Driver validation rules
 */
const validateDriver = [
    body('first_name')
        .notEmpty().withMessage('First name is required')
        .isString().withMessage('First name must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
        .trim(),
    body('last_name')
        .notEmpty().withMessage('Last name is required')
        .isString().withMessage('Last name must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
        .trim(),
    body('nic_number')
        .optional()
        .matches(/^([0-9]{9}[vV]|[0-9]{12})$/).withMessage('Invalid NIC number format'),
    body('phone')
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid Sri Lankan phone number'),
    body('email')
        .optional()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .trim(),
    body('license_number')
        .notEmpty().withMessage('License number is required')
        .isString().withMessage('License number must be a string')
        .isLength({ max: 20 }).withMessage('License number cannot exceed 20 characters')
        .trim()
        .toUpperCase(),
    body('license_expiry')
        .notEmpty().withMessage('License expiry date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom(value => new Date(value) > new Date())
        .withMessage('License expiry date must be in the future'),
    body('license_class')
        .optional()
        .isString().withMessage('License class must be a string')
        .isLength({ max: 10 }).withMessage('License class cannot exceed 10 characters'),
    body('date_of_birth')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .custom(value => {
            const age = new Date().getFullYear() - new Date(value).getFullYear();
            return age >= 18;
        }).withMessage('Driver must be at least 18 years old'),
    body('hire_date')
        .notEmpty().withMessage('Hire date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('emergency_contact')
        .optional()
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid emergency contact number'),
    body('max_working_hours_per_day')
        .optional()
        .isInt({ min: 4, max: 12 }).withMessage('Max working hours must be between 4 and 12'),
    body('status')
        .optional()
        .isIn(['available', 'on_duty', 'off_duty', 'suspended', 'terminated']).withMessage('Invalid status'),
    validateRequest
];

/**
 * Update driver working hours validation
 */
const validateWorkingHours = [
    param('id')
        .isInt({ min: 1 }).withMessage('Driver ID must be a positive integer')
        .toInt(),
    body('hours')
        .notEmpty().withMessage('Hours are required')
        .isFloat({ min: 0.5, max: 12 }).withMessage('Hours must be between 0.5 and 12'),
    validateRequest
];

/**
 * Update driver rating validation
 */
const validateDriverRating = [
    param('id')
        .isInt({ min: 1 }).withMessage('Driver ID must be a positive integer')
        .toInt(),
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    validateRequest
];

// ============================================
// SCHEDULE VALIDATION RULES
// ============================================

/**
 * Schedule validation rules
 */
const validateSchedule = [
    body('route_id')
        .notEmpty().withMessage('Route ID is required')
        .isInt({ min: 1 }).withMessage('Route ID must be a positive integer')
        .toInt(),
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    body('driver_id')
        .notEmpty().withMessage('Driver ID is required')
        .isInt({ min: 1 }).withMessage('Driver ID must be a positive integer')
        .toInt(),
    body('departure_time')
        .notEmpty().withMessage('Departure time is required')
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom(value => new Date(value) > new Date())
        .withMessage('Departure time must be in the future'),
    body('arrival_time')
        .notEmpty().withMessage('Arrival time is required')
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom((value, { req }) => new Date(value) > new Date(req.body.departure_time))
        .withMessage('Arrival time must be after departure time'),
    body('trip_type')
        .optional()
        .isIn(['regular', 'express', 'night', 'special']).withMessage('Invalid trip type'),
    body('trip_status')
        .optional()
        .isIn(['scheduled', 'on_time', 'delayed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Invalid trip status'),
    body('notes')
        .optional()
        .isString().withMessage('Notes must be a string')
        .trim(),
    validateRequest
];

/**
 * Update trip status validation
 */
const validateTripStatus = [
    param('id')
        .isInt({ min: 1 }).withMessage('Schedule ID must be a positive integer')
        .toInt(),
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['scheduled', 'on_time', 'delayed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Invalid trip status'),
    body('delay_minutes')
        .optional()
        .isInt({ min: 0 }).withMessage('Delay minutes must be a positive integer')
        .toInt(),
    body('delay_reason')
        .optional()
        .isString().withMessage('Delay reason must be a string')
        .trim(),
    validateRequest
];

// ============================================
// TICKET VALIDATION RULES
// ============================================

/**
 * Ticket validation rules
 */
const validateTicket = [
    body('schedule_id')
        .notEmpty().withMessage('Schedule ID is required')
        .isInt({ min: 1 }).withMessage('Schedule ID must be a positive integer')
        .toInt(),
    body('passenger_name')
        .notEmpty().withMessage('Passenger name is required')
        .isString().withMessage('Passenger name must be a string')
        .isLength({ min: 2, max: 100 }).withMessage('Passenger name must be between 2 and 100 characters')
        .trim(),
    body('passenger_nic')
        .optional()
        .matches(/^([0-9]{9}[vV]|[0-9]{12})$/).withMessage('Invalid NIC number format'),
    body('passenger_phone')
        .notEmpty().withMessage('Passenger phone is required')
        .matches(/^(07[0-9]{8}|0[1-9][0-9]{8})$/).withMessage('Invalid Sri Lankan phone number'),
    body('seat_number')
        .notEmpty().withMessage('Seat number is required')
        .isString().withMessage('Seat number must be a string')
        .matches(/^[A-Z]?[0-9]+$/).withMessage('Seat number format is invalid')
        .trim()
        .toUpperCase(),
    body('from_stop_id')
        .notEmpty().withMessage('From stop ID is required')
        .isInt({ min: 1 }).withMessage('From stop ID must be a positive integer')
        .toInt(),
    body('to_stop_id')
        .notEmpty().withMessage('To stop ID is required')
        .isInt({ min: 1 }).withMessage('To stop ID must be a positive integer')
        .toInt()
        .custom((value, { req }) => value !== req.body.from_stop_id)
        .withMessage('From stop and to stop cannot be the same'),
    body('fare_amount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Fare amount must be a positive number'),
    body('payment_method')
        .optional()
        .isIn(['cash', 'card', 'mobile_payment']).withMessage('Invalid payment method'),
    validateRequest
];

/**
 * Cancel ticket validation
 */
const validateTicketCancellation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Ticket ID must be a positive integer')
        .toInt(),
    body('reason')
        .optional()
        .isString().withMessage('Cancellation reason must be a string')
        .isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters')
        .trim(),
    validateRequest
];

// ============================================
// FUEL LOG VALIDATION RULES
// ============================================

/**
 * Fuel log validation rules
 */
const validateFuelLog = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    body('fuel_date')
        .notEmpty().withMessage('Fuel date is required')
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom(value => new Date(value) <= new Date())
        .withMessage('Fuel date cannot be in the future'),
    body('fuel_amount')
        .notEmpty().withMessage('Fuel amount is required')
        .isFloat({ min: 0.1 }).withMessage('Fuel amount must be at least 0.1 liters'),
    body('cost_per_liter')
        .notEmpty().withMessage('Cost per liter is required')
        .isFloat({ min: 0 }).withMessage('Cost per liter must be a positive number'),
    body('odometer_reading')
        .notEmpty().withMessage('Odometer reading is required')
        .isFloat({ min: 0 }).withMessage('Odometer reading must be a positive number'),
    body('fuel_type')
        .optional()
        .isIn(['Diesel', 'Petrol', 'Electric', 'CNG']).withMessage('Invalid fuel type'),
    body('refueling_location')
        .optional()
        .isString().withMessage('Refueling location must be a string')
        .isLength({ max: 100 }).withMessage('Refueling location cannot exceed 100 characters')
        .trim(),
    body('receipt_number')
        .optional()
        .isString().withMessage('Receipt number must be a string')
        .isLength({ max: 50 }).withMessage('Receipt number cannot exceed 50 characters')
        .trim(),
    body('remarks')
        .optional()
        .isString().withMessage('Remarks must be a string')
        .trim(),
    validateRequest
];

// ============================================
// MAINTENANCE LOG VALIDATION RULES
// ============================================

/**
 * Maintenance log validation rules
 */
const validateMaintenanceLog = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
    body('maintenance_date')
        .notEmpty().withMessage('Maintenance date is required')
        .isISO8601().withMessage('Invalid date format')
        .toDate(),
    body('maintenance_type')
        .notEmpty().withMessage('Maintenance type is required')
        .isIn(['routine', 'corrective', 'emergency', 'preventive']).withMessage('Invalid maintenance type'),
    body('maintenance_category')
        .notEmpty().withMessage('Maintenance category is required')
        .isIn(['engine', 'brake', 'tire', 'electrical', 'body', 'AC', 'other'])
        .withMessage('Invalid maintenance category'),
    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string')
        .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters')
        .trim(),
    body('odometer_at_service')
        .notEmpty().withMessage('Odometer reading is required')
        .isFloat({ min: 0 }).withMessage('Odometer reading must be a positive number'),
    body('cost')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('vendor_name')
        .optional()
        .isString().withMessage('Vendor name must be a string')
        .isLength({ max: 100 }).withMessage('Vendor name cannot exceed 100 characters')
        .trim(),
    body('invoice_number')
        .optional()
        .isString().withMessage('Invoice number must be a string')
        .isLength({ max: 50 }).withMessage('Invoice number cannot exceed 50 characters')
        .trim(),
    body('next_due_date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .toDate(),
    body('next_due_odometer')
        .optional()
        .isFloat({ min: 0 }).withMessage('Next due odometer must be a positive number'),
    validateRequest
];

/**
 * Complete maintenance validation
 */
const validateCompleteMaintenance = [
    param('id')
        .isInt({ min: 1 }).withMessage('Maintenance log ID must be a positive integer')
        .toInt(),
    validateRequest
];

// ============================================
// TRACKING VALIDATION RULES
// ============================================

/**
 * Bus location update validation
 */
const validateBusLocation = [
    body('bus_id')
        .notEmpty().withMessage('Bus ID is required')
        .isInt({ min: 1 }).withMessage('Bus ID must be a positive integer')
        .toInt(),
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
    body('accuracy')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Accuracy must be between 0 and 100 meters'),
    body('altitude')
        .optional()
        .isFloat().withMessage('Altitude must be a number'),
    body('battery_level')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Battery level must be between 0 and 100%'),
    body('schedule_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Schedule ID must be a positive integer')
        .toInt(),
    validateRequest
];

// ============================================
// SEARCH & FILTER VALIDATION
// ============================================

/**
 * Search query validation
 */
const validateSearch = [
    query('q')
        .optional()
        .isString().withMessage('Search query must be a string')
        .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
        .trim()
        .escape(),
    query('status')
        .optional()
        .isString().withMessage('Status must be a string'),
    validatePagination,
    validateRequest
];

/**
 * Report generation validation
 */
const validateReport = [
    query('report_type')
        .notEmpty().withMessage('Report type is required')
        .isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('Invalid report type'),
    query('start_date')
        .optional()
        .isISO8601().withMessage('Invalid start date format')
        .toDate(),
    query('end_date')
        .optional()
        .isISO8601().withMessage('Invalid end date format')
        .toDate()
        .custom((value, { req }) => {
            if (req.query.start_date && value && new Date(value) < new Date(req.query.start_date)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    query('format')
        .optional()
        .isIn(['json', 'pdf', 'csv']).withMessage('Invalid export format'),
    validateRequest
];

// ============================================
// EXPORT ALL VALIDATION RULES
// ============================================

module.exports = {
    // Core middleware
    validateRequest,
    validateIdParam,
    validatePagination,
    validateDateRange,

    // Auth validations
    validateLogin,
    validateChangePassword,
    validateCreateAdmin,

    // Route validations
    validateRoute,
    validateRouteStop,
    validateBulkRouteStops,

    // Bus validations
    validateBus,
    validateOdometerUpdate,
    validateAssignRoute,

    // Driver validations
    validateDriver,
    validateWorkingHours,
    validateDriverRating,

    // Schedule validations
    validateSchedule,
    validateTripStatus,

    // Ticket validations
    validateTicket,
    validateTicketCancellation,

    // Fuel log validations
    validateFuelLog,

    // Maintenance validations
    validateMaintenanceLog,
    validateCompleteMaintenance,

    // Tracking validations
    validateBusLocation,

    // Search & Report validations
    validateSearch,
    validateReport
};