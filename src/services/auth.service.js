// src/services/auth.service.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminRepository = require("../repositories/admin.repository");

class AuthService {
    static async login(username, password) {
        //  Get admin with password
        const admin = await adminRepository.findByUsername(username);

        if (!admin) {
            throw new Error("Invalid credentials");
        }

        if (admin.status !== "active") {
            throw new Error("Account is inactive");
        }

        // ✅ Debug logs
        console.log("=== LOGIN DEBUG ===");
        console.log("Username:", username);
        console.log("Password entered:", password);
        console.log("Stored hash:", admin.password);
        console.log("=================");

        // ✅ Direct bcrypt compare
        const isValidPassword = await bcrypt.compare(password, admin.password);

        console.log("Password valid:", isValidPassword);

        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }

        // Update last login
        await adminRepository.updateLastLogin(admin.admin_id, new Date());

        // Generate tokens
        const accessToken = this.generateAccessToken(admin);
        const refreshToken = this.generateRefreshToken(admin);

        return {
            admin: {
                admin_id: admin.admin_id,
                username: admin.username,
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role
            },
            accessToken,
            refreshToken
        };
    }

    static generateAccessToken(admin) {
        return jwt.sign(
            { id: admin.admin_id, username: admin.username, role: admin.role, type: "access" },
            process.env.JWT_SECRET || "srmss_secret_key",
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );
    }

    static generateRefreshToken(admin) {
        return jwt.sign(
            { id: admin.admin_id, username: admin.username, type: "refresh" },
            process.env.JWT_REFRESH_SECRET || "srmss_refresh_key",
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
        );
    }

    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "srmss_refresh_key");
            if (decoded.type !== "refresh") throw new Error("Invalid token type");
            return decoded;
        } catch (error) {
            if (error.name === "TokenExpiredError") throw new Error("Refresh token has expired");
            throw new Error("Invalid refresh token");
        }
    }

    static async refreshToken(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);
        const admin = await adminRepository.findByIdWithPassword(decoded.id);
        if (!admin) throw new Error("Admin not found");
        if (admin.status !== "active") throw new Error("Admin account is inactive");

        return {
            accessToken: this.generateAccessToken(admin),
            refreshToken: this.generateRefreshToken(admin)
        };
    }

    static async getProfile(adminId) {
        const admin = await adminRepository.findById(adminId);
        if (!admin) throw new Error("Admin not found");
        return admin;
    }

    static async changePassword(adminId, currentPassword, newPassword) {
        const admin = await adminRepository.findByIdWithPassword(adminId);
        if (!admin) throw new Error("Admin not found");

        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) throw new Error("Current password is incorrect");

        if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await adminRepository.updatePassword(adminId, hashedPassword);

        return true;
    }

    static async getAllAdmins(filters) {
        return await adminRepository.findAll(filters);
    }

    static async createAdmin(data) {
        const existing = await adminRepository.findByUsername(data.username);
        if (existing) throw new Error("Username already exists");

        const existingEmail = await adminRepository.findByEmail(data.email);
        if (existingEmail) throw new Error("Email already exists");

        return await adminRepository.create(data);
    }

    static async updateAdmin(id, data) {
        const admin = await adminRepository.findById(id);
        if (!admin) throw new Error("Admin not found");

        // Check username uniqueness if changing
        if (data.username && data.username !== admin.username) {
            const existing = await adminRepository.findByUsername(data.username);
            if (existing) throw new Error("Username already exists");
        }

        // Check email uniqueness if changing
        if (data.email && data.email !== admin.email) {
            const existing = await adminRepository.findByEmail(data.email);
            if (existing && existing.admin_id !== id) throw new Error("Email already in use");
        }

        // Hash password if provided
        if (data.password && data.password.trim() !== "") {
            if (data.password.length < 6) throw new Error("Password must be at least 6 characters");
            data.password = await bcrypt.hash(data.password, 10);
        } else {
            delete data.password;
        }

        return await adminRepository.update(id, data);
    }

    static async deleteAdmin(id, currentAdminId) {
        // Prevent self-deletion
        if (parseInt(id) === currentAdminId) {
            throw new Error("Cannot delete your own account");
        }

        const admin = await adminRepository.findById(id);
        if (!admin) throw new Error("Admin not found");

        return await adminRepository.deleteAdmin(id);
        }
}

module.exports = AuthService;