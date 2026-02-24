const express = require("express");
const router = express.Router();
const {
	registerParticipant,
	login,
	logout,
	getMe,
	changePassword,
	requestPasswordReset,
} = require("../controllers/authController");
const {
	protect,
	validateParticipantRegistration,
	validateLogin,
	validatePasswordChange,
} = require("../middleware");

// Public routes
router.post("/register", validateParticipantRegistration, registerParticipant);
router.post("/login", validateLogin, login);
router.post("/request-password-reset", requestPasswordReset);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/change-password", protect, validatePasswordChange, changePassword);

module.exports = router;
