const express = require("express");
const router = express.Router();
const {
	createOrganizer,
	getAllOrganizers,
	getOrganizer,
	updateOrganizer,
	deleteOrganizer,
	resetOrganizerPassword,
	getDashboardStats,
	getPasswordRequests,
	handlePasswordRequest,
} = require("../controllers/adminController");
const {
	protect,
	authorize,
	validateOrganizerCreation,
} = require("../middleware");

// All routes require admin authorization
router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Password requests
router.get("/password-requests", getPasswordRequests);
router.put("/password-requests/:id", handlePasswordRequest);

// Organizer management
router
	.route("/organizers")
	.get(getAllOrganizers)
	.post(validateOrganizerCreation, createOrganizer);

router
	.route("/organizers/:id")
	.get(getOrganizer)
	.put(updateOrganizer)
	.delete(deleteOrganizer);

router.put("/organizers/:id/reset-password", resetOrganizerPassword);

module.exports = router;
