const express = require("express");
const router = express.Router();
const {
	updatePreferences,
	getProfile,
	updateProfile,
	toggleFollowOrganizer,
} = require("../controllers/participantController");
const {
	browseEvents,
	getTrendingEvents,
	getEventDetails,
	registerForEvent,
	cancelRegistration,
	getMyRegistrations,
	getAllOrganizers,
	getOrganizerDetails,
	submitFeedback,
	getCalendarFile,
	uploadPaymentProof,
	getGoogleCalendarLink,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware");

// All routes require participant authorization
router.use(protect);
router.use(authorize("participant"));

// Preferences
router.put("/preferences", updatePreferences);

// Profile
router.route("/profile").get(getProfile).put(updateProfile);

// Events
router.get("/events", browseEvents);
router.get("/events/trending", getTrendingEvents);
router.get("/events/:id", getEventDetails);
router.post("/events/:id/register", registerForEvent);

// Feedback & Calendar
router.post("/events/:id/feedback", submitFeedback);
router.get("/events/:id/calendar", getCalendarFile);
router.get("/events/:id/google-calendar", getGoogleCalendarLink);

// Registrations (My Events)
router.get("/registrations", getMyRegistrations);
router.delete("/registrations/:id", cancelRegistration);
router.post("/registrations/:id/payment-proof", uploadPaymentProof);

// Organizers (Clubs/Councils)
router.get("/organizers", getAllOrganizers);
router.get("/organizers/:id", getOrganizerDetails);
router.post("/organizers/:id/follow", toggleFollowOrganizer);

module.exports = router;
