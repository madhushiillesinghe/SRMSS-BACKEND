const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminRepository = require("../repositories/admin.repository");

class AuthService {
    static async login(username, password) {
        const admin = await adminRepository.findByUsername(username);

        if (!admin) throw new Error("Invalid credentials");
        if (admin.status !== "active") throw new Error("Account is inactive");

        const isValidPassword = await admin.verifyPassword(password);
        if (!isValidPassword) throw new Error("Invalid credentials");

        await adminRepository.updateLastLogin(admin.admin_id, new Date());

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
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );
    }

    static generateRefreshToken(admin) {
        return jwt.sign(
            { id: admin.admin_id, username: admin.username, type: "refresh" },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
        );
    }

    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            if (decoded.type !== "refresh") throw new Error("Invalid token type");
            return decoded;
        } catch (error) {
            if (error.name === "TokenExpiredError") throw new Error("Refresh token has expired");
            throw new Error("Invalid refresh token");
        }
    }

    static async refreshToken(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);
        const admin = await adminRepository.findById(decoded.id);
        if (!admin) throw new Error("Admin not found");
        if (admin.status !== "active") throw new Error("Admin account is inactive");

        const fullAdmin = await adminRepository.findByIdWithPassword(decoded.id);

        return {
            accessToken: this.generateAccessToken(fullAdmin),
            refreshToken: this.generateRefreshToken(fullAdmin)
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

        const isValid = await admin.verifyPassword(currentPassword);
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

        if (data.email) {
            const existing = await adminRepository.findByEmail(data.email);
            if (existing && existing.admin_id !== id) throw new Error("Email already in use");
        }

        return await adminRepository.update(id, data);
    }
}

module.exports = AuthService;