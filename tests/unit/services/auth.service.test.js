const AuthService = require("../../../src/services/auth.service");
const adminRepository = require("../../../src/repositories/admin.repository");
const bcrypt = require("bcryptjs");

jest.mock("../../../src/repositories/admin.repository");
jest.mock("bcryptjs");

describe("AuthService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("login", () => {
        it("should return tokens on valid credentials", async () => {
            const mockAdmin = {
                admin_id: 1,
                username: "admin",
                password: "hashed",
                status: "active",
                full_name: "Test Admin",
                email: "test@example.com",
                role: "super_admin",
            };
            adminRepository.findByUsername.mockResolvedValue(mockAdmin);
            bcrypt.compare.mockResolvedValue(true);

            const result = await AuthService.login("admin", "password123");

            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result.admin.username).toBe("admin");
            expect(adminRepository.updateLastLogin).toHaveBeenCalled();
        });

        it("should throw error for invalid password", async () => {
            adminRepository.findByUsername.mockResolvedValue({ status: "active", password: "hash" });
            bcrypt.compare.mockResolvedValue(false);
            await expect(AuthService.login("admin", "wrong")).rejects.toThrow("Invalid credentials");
        });

        it("should throw error for inactive account", async () => {
            adminRepository.findByUsername.mockResolvedValue({ status: "inactive" });
            await expect(AuthService.login("admin", "pass")).rejects.toThrow("Account is inactive");
        });
    });

    describe("changePassword", () => {
        it("should change password successfully", async () => {
            const mockAdmin = { admin_id: 1, password: "oldHash" };
            adminRepository.findByIdWithPassword.mockResolvedValue(mockAdmin);
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.hash.mockResolvedValue("newHash");

            await AuthService.changePassword(1, "oldPass", "newPass123");

            expect(adminRepository.updatePassword).toHaveBeenCalledWith(1, "newHash");
        });

        it("should throw if current password incorrect", async () => {
            adminRepository.findByIdWithPassword.mockResolvedValue({ password: "hash" });
            bcrypt.compare.mockResolvedValue(false);
            await expect(AuthService.changePassword(1, "wrong", "new")).rejects.toThrow("Current password is incorrect");
        });
    });
});