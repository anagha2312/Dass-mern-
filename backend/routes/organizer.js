const express = require("express");
const router = express.Router();
const {
	createEvent,
	getOrganizerEvents,
	getOrganizerEvent,
	updateEvent,
	deleteEvent,
	getEventRegistrations,
	updateRegistrationStatus,
	getDashboardStats,
	getProfile,
	updateProfile,
	changePassword,
	markAttendance,
	getPendingPayments,
	handlePaymentApproval,
	scanQRCode,
	getAttendanceStats,
	getEventFeedback,
} = require("../controllers/organizerController");
const { protect, authorize } = require("../middleware");

// All routes require organizer authorization
router.use(protect);
router.use(authorize("organizer"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Profile
router.route("/profile").get(getProfile).put(updateProfile);
router.put("/change-password", changePassword);

// Events
router.route("/events").get(getOrganizerEvents).post(createEvent);

router
	.route("/events/:id")
	.get(getOrganizerEvent)
	.put(updateEvent)
	.delete(deleteEvent);

// Event Registrations
router.get("/events/:id/registrations", getEventRegistrations);

router.put(
	"/events/:eventId/registrations/:registrationId",
	updateRegistrationStatus,
);

router.put(
	"/events/:eventId/registrations/:registrationId/attendance",
	markAttendance,
);

// Merchandise Payment Approval Workflow
router.get("/events/:id/pending-payments", getPendingPayments);
router.put("/events/:eventId/payments/:registrationId", handlePaymentApproval);

// QR Scanner & Attendance Tracking
router.post("/events/:eventId/scan-qr", scanQRCode);
router.get("/events/:id/attendance", getAttendanceStats);

// Feedback
router.get("/events/:id/feedback", getEventFeedback);

module.exports = router;
