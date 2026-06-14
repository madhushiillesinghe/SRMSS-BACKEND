// src/middleware/driver.middleware.js
const jwt = require("jsonwebtoken");
const driverRepository = require("../repositories/driver.repository");

const protectDriver = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "driver") {
            return res.status(401).json({ success: false, message: "Not authorized as driver" });
        }
        const driver = await driverRepository.findById(decoded.id);
        if (!driver) {
            return res.status(401).json({ success: false, message: "Driver not found" });
        }
        req.driver = { id: driver.driver_id, driver_code: driver.driver_code };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

module.exports = { protectDriver };