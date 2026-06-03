const jwt = require("jsonwebtoken");
const adminRepository = require("../repositories/admin.repository");

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid token type"
            });
        }

        const admin = await adminRepository.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (admin.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Account is inactive"
            });
        }

        req.admin = {
            id: admin.admin_id,
            username: admin.username,
            role: admin.role
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Not authorized"
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.admin.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };