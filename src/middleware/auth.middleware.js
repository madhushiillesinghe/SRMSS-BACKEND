// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const adminRepository = require("../repositories/admin.repository");

const protect = async (req, res, next) => {
    try {
        let token;

        //  Extract token from headers
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        //  Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route. No token provided."
            });
        }

        //  Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //  Check token type (must be access token)
        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid token type. Please use an access token."
            });
        }

        //  Find admin in database
        const admin = await adminRepository.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found. Token is invalid."
            });
        }

        //  Check account status
        if (admin.status !== "active") {
            return res.status(401).json({
                success: false,
                message: `Account is ${admin.status}. Please contact administrator.`
            });
        }

        //  Attach admin to request object
        req.admin = {
            id: admin.admin_id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            status: admin.status
        };

        next();
    } catch (error) {
        //  Handle specific JWT errors
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please refresh your token or login again.",
                code: "TOKEN_EXPIRED"
            });
        }

        // Generic error
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route"
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if admin exists in request
        if (!req.admin || !req.admin.role) {
            return res.status(403).json({
                success: false,
                message: "Authorization failed. User context missing."
            });
        }

        //  Check if user has required role
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.admin.role}' is not authorized. Required roles: ${roles.join(", ")}`
            });
        }

        next();
    };
};

//  Optional: Middleware for optional auth (works with or without token)
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type === "access") {
                const admin = await adminRepository.findById(decoded.id);
                if (admin && admin.status === "active") {
                    req.admin = {
                        id: admin.admin_id,
                        username: admin.username,
                        role: admin.role
                    };
                }
            }
        }

        next();
    } catch (error) {
        // Continue even if token is invalid
        next();
    }
};

// Role constants for easier use
const ROLES = {
    SUPER_ADMIN: "super_admin",
    DEPOT_MANAGER: "depot_manager",
    SCHEDULER: "scheduler",
    TICKET_OFFICER: "ticket_officer",
    VIEWER: "viewer"
};

// Pre-defined role combinations
const authorizeAdmin = authorize(ROLES.SUPER_ADMIN);
const authorizeManager = authorize(ROLES.SUPER_ADMIN, ROLES.DEPOT_MANAGER);
const authorizeScheduler = authorize(ROLES.SUPER_ADMIN, ROLES.DEPOT_MANAGER, ROLES.SCHEDULER);
const authorizeTicketOfficer = authorize(ROLES.SUPER_ADMIN, ROLES.DEPOT_MANAGER, ROLES.TICKET_OFFICER);

//  IMPORTANT: Export both 'protect' and 'authenticate' for compatibility
module.exports = {
    protect,
    authenticate: protect,  // ← Add this alias for compatibility
    authorize,
    optionalAuth,
    ROLES,
    authorizeAdmin,
    authorizeManager,
    authorizeScheduler,
    authorizeTicketOfficer
};