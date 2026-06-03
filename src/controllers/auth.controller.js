const AuthService = require("../services/auth.service");

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const result = await AuthService.login(username, password);

        res.json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        if (error.message === "Invalid credentials") {
            return res.status(401).json({ success: false, message: error.message });
        }
        if (error.message === "Account is inactive") {
            return res.status(401).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const result = await AuthService.refreshToken(refreshToken);

        res.json({
            success: true,
            message: "Token refreshed successfully",
            data: result
        });
    } catch (error) {
        if (error.message === "Refresh token has expired" || error.message === "Invalid refresh token") {
            return res.status(401).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const admin = await AuthService.getProfile(req.admin.id);

        res.json({
            success: true,
            data: admin
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match"
            });
        }

        await AuthService.changePassword(req.admin.id, currentPassword, newPassword);

        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        if (error.message === "Current password is incorrect") {
            return res.status(401).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const logout = async (req, res) => {
    res.json({
        success: true,
        message: "Logged out successfully"
    });
};

const getAllAdmins = async (req, res, next) => {
    try {
        const { status, role, search } = req.query;
        const admins = await AuthService.getAllAdmins({ status, role, search });

        res.json({
            success: true,
            message: "Admins retrieved successfully",
            data: admins
        });
    } catch (error) {
        next(error);
    }
};

const createAdmin = async (req, res, next) => {
    try {
        const admin = await AuthService.createAdmin(req.body);

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: admin
        });
    } catch (error) {
        if (error.message === "Username already exists" || error.message === "Email already exists") {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    login,
    refreshToken,
    getMe,
    changePassword,
    logout,
    getAllAdmins,
    createAdmin
};