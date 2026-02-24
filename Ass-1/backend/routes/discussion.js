const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
	getDiscussionMessages,
	postMessage,
	editMessage,
	deleteMessage,
	toggleReaction,
	togglePinMessage,
} = require("../controllers/discussionController");

// Validation rules
const messageValidation = [
	body("content")
		.trim()
		.notEmpty()
		.withMessage("Message content is required")
		.isLength({ max: 2000 })
		.withMessage("Message cannot exceed 2000 characters"),
];

const reactionValidation = [
	body("emoji")
		.notEmpty()
		.withMessage("Emoji is required")
		.isIn(["👍", "❤️", "😂", "😮", "😢", "🎉"])
		.withMessage("Invalid emoji"),
];

// All routes require authentication
router.use(protect);

// Get discussion messages for an event
router.get("/event/:eventId", getDiscussionMessages);

// Post a new message (participants and organizers)
router.post(
	"/event/:eventId",
	authorize("participant", "organizer"),
	messageValidation,
	handleValidationErrors,
	postMessage,
);

// Edit a message
router.put(
	"/message/:messageId",
	authorize("participant", "organizer"),
	messageValidation,
	handleValidationErrors,
	editMessage,
);

// Delete a message
router.delete(
	"/message/:messageId",
	authorize("participant", "organizer"),
	deleteMessage,
);

// Toggle reaction on a message
router.post(
	"/message/:messageId/reaction",
	authorize("participant", "organizer"),
	reactionValidation,
	handleValidationErrors,
	toggleReaction,
);

// Pin/unpin a message (organizer only)
router.post(
	"/message/:messageId/pin",
	authorize("organizer"),
	togglePinMessage,
);

module.exports = router;
