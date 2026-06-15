const express = require("express");
const {
    login,
    refreshToken,
    getMe,
    changePassword,
    logout,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin
} = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

// Admin management (super_admin only)
router.get("/admins", protect, authorize("super_admin"), getAllAdmins);
router.post("/admins", protect, authorize("super_admin"), createAdmin);
router.put("/admins/:id", protect, authorize("super_admin"), updateAdmin);
router.delete("/admins/:id", protect, authorize("super_admin"), deleteAdmin);
module.exports = router;