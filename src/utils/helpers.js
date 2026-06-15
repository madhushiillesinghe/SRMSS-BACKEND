/**
 * Helper functions for SRMSS Backend
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
};

/**
 * Generate a unique code with prefix
 * @param {string} prefix - Prefix for the code (e.g., 'DRV', 'BUS', 'TKT')
 * @param {number} number - Number to append
 * @returns {string} Formatted code
 */
const generateCode = (prefix, number) => {
    const paddedNumber = String(number).padStart(4, '0');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${prefix}${year}${month}${paddedNumber}`;
};

/**
 * Format currency to LKR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2
    }).format(amount);
};

/**
 * Format date to local string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('date', 'time', 'datetime')
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'datetime') => {
    const d = new Date(date);

    switch(format) {
        case 'date':
            return d.toLocaleDateString('en-LK');
        case 'time':
            return d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
        case 'datetime':
            return d.toLocaleString('en-LK');
        default:
            return d.toLocaleString('en-LK');
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Calculate estimated arrival time based on distance and speed
 * @param {number} distance - Distance in km
 * @param {number} speed - Speed in km/h
 * @returns {number} Estimated time in minutes
 */
const calculateEstimatedTime = (distance, speed) => {
    if (speed <= 0) return 0;
    return (distance / speed) * 60;
};

/**
 * Calculate fare based on distance and fare rates
 * @param {number} distance - Distance in km
 * @param {number} baseFare - Base fare amount
 * @param {number} farePerKm - Fare per kilometer
 * @returns {number} Total fare
 */
const calculateFare = (distance, baseFare, farePerKm) => {
    return baseFare + (distance * farePerKm);
};

/**
 * Calculate average speed from distance and time
 * @param {number} distance - Distance in km
 * @param {number} minutes - Time in minutes
 * @returns {number} Average speed in km/h
 */
const calculateAverageSpeed = (distance, minutes) => {
    if (minutes <= 0) return 0;
    return (distance / minutes) * 60;
};

/**
 * Calculate fuel efficiency
 * @param {number} distance - Distance traveled in km
 * @param {number} fuelAmount - Fuel consumed in liters
 * @returns {number} Fuel efficiency in km/l
 */
const calculateFuelEfficiency = (distance, fuelAmount) => {
    if (fuelAmount <= 0) return 0;
    return distance / fuelAmount;
};

/**
 * Calculate occupancy rate
 * @param {number} currentPassengers - Current passenger count
 * @param {number} capacity - Vehicle capacity
 * @returns {number} Occupancy percentage
 */
const calculateOccupancyRate = (currentPassengers, capacity) => {
    if (capacity <= 0) return 0;
    return (currentPassengers / capacity) * 100;
};

/**
 * Check if a date is expired
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if expired
 */
const isExpired = (date) => {
    return new Date(date) < new Date();
};

/**
 * Get days difference between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Days difference
 */
const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get start and end of day
 * @param {Date} date - Date object (defaults to today)
 * @returns {Object} { start, end }
 */
const getDayRange = (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/**
 * Get start and end of week (Monday to Sunday)
 * @param {Date} date - Date object (defaults to today)
 * @returns {Object} { start, end }
 */
const getWeekRange = (date = new Date()) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/**
 * Get start and end of month
 * @param {Date} date - Date object (defaults to today)
 * @returns {Object} { start, end }
 */
const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/**
 * Paginate results
 * @param {Array} data - Array of data
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
const paginate = (data, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedData = data.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            total: data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(data.length / limit),
            hasNext: endIndex < data.length,
            hasPrev: startIndex > 0
        }
    };
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove null/undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
const cleanObject = (obj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
        }
    }
    return cleaned;
};

/**
 * Convert time string to minutes
 * @param {string} time - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
};

/**
 * Convert minutes to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:MM format
 */
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Generate seat map for bus
 * @param {number} capacity - Bus capacity
 * @param {Array} occupiedSeats - Array of occupied seat numbers
 * @returns {Array} Seat map with status
 */
const generateSeatMap = (capacity, occupiedSeats = []) => {
    const seats = [];
    const rows = Math.ceil(capacity / 4); // 4 seats per row

    for (let i = 1; i <= capacity; i++) {
        const row = Math.ceil(i / 4);
        const position = ((i - 1) % 4) + 1;
        const isOccupied = occupiedSeats.includes(String(i)) || occupiedSeats.includes(i);

        seats.push({
            seat_number: String(i),
            row: row,
            position: position,
            is_available: !isOccupied,
            is_occupied: isOccupied,
            position_type: position <= 2 ? 'window' : 'aisle'
        });
    }

    return seats;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Sri Lankan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^(07[0-9]{8}|0[1-9][0-9]{8})$/;
    return phoneRegex.test(phone);
};

/**
 * Validate NIC number (Sri Lankan format)
 * @param {string} nic - NIC number to validate
 * @returns {boolean} True if valid
 */
const isValidNIC = (nic) => {
    const oldNicRegex = /^[0-9]{9}[vV]$/;
    const newNicRegex = /^[0-9]{12}$/;
    return oldNicRegex.test(nic) || newNicRegex.test(nic);
};

/**
 * Hash data using bcrypt
 * @param {string} data - Data to hash
 * @param {number} rounds - Salt rounds (default: 10)
 * @returns {Promise<string>} Hashed data
 */
const hashData = async (data, rounds = 10) => {
    return await bcrypt.hash(data, rounds);
};

/**
 * Compare plain data with hash
 * @param {string} plainData - Plain data
 * @param {string} hashedData - Hashed data
 * @returns {Promise<boolean>} True if matches
 */
const compareHash = async (plainData, hashedData) => {
    return await bcrypt.compare(plainData, hashedData);
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function multiple times
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>} Result of function
 */
const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await sleep(delay);
        return retry(fn, retries - 1, delay);
    }
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return (part / total) * 100;
};

module.exports = {
    generateRandomString,
    generateCode,
    formatCurrency,
    formatDate,
    calculateDistance,
    calculateEstimatedTime,
    calculateFare,
    calculateAverageSpeed,
    calculateFuelEfficiency,
    calculateOccupancyRate,
    isExpired,
    getDaysDifference,
    getDayRange,
    getWeekRange,
    getMonthRange,
    paginate,
    deepClone,
    cleanObject,
    timeToMinutes,
    minutesToTime,
    generateSeatMap,
    isValidEmail,
    isValidPhone,
    isValidNIC,
    hashData,
    compareHash,
    sleep,
    retry,
    groupBy,
    calculatePercentage
};