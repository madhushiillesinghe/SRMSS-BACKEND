const authController = require("../../../src/controllers/auth.controller");
const AuthService = require("../../../src/services/auth.service");

// Mock the entire AuthService module
jest.mock("../../../src/services/auth.service");

let req, res, next;

beforeEach(() => {
    req = { body: {}, admin: { id: 1 } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
});

describe("AuthController", () => {
    test("login success", async () => {
        req.body = { username: "admin", password: "pass" };
        // Now AuthService.login is a mock function
        AuthService.login.mockResolvedValue({ accessToken: "token", refreshToken: "rt" });
        await authController.login(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test("login missing credentials returns 400", async () => {
        req.body = { username: "admin" };
        await authController.login(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("changePassword success", async () => {
        req.body = { currentPassword: "old", newPassword: "new", confirmPassword: "new" };
        AuthService.changePassword.mockResolvedValue(true);
        await authController.changePassword(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test("changePassword mismatch returns 400", async () => {
        req.body = { currentPassword: "old", newPassword: "new", confirmPassword: "different" };
        await authController.changePassword(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: expect.stringContaining("do not match") }));
    });
});