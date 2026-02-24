const { body, validationResult } = require("express-validator");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			errors: errors.array().map((err) => ({
				field: err.path,
				message: err.msg,
			})),
		});
	}
	next();
};

// Participant registration validation
const validateParticipantRegistration = [
	body("email")
		.trim()
		.isEmail()
		.withMessage("Please enter a valid email")
		.normalizeEmail(),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
	body("firstName")
		.trim()
		.notEmpty()
		.withMessage("First name is required")
		.isLength({ max: 50 })
		.withMessage("First name cannot exceed 50 characters"),
	body("lastName")
		.trim()
		.notEmpty()
		.withMessage("Last name is required")
		.isLength({ max: 50 })
		.withMessage("Last name cannot exceed 50 characters"),
	body("contactNumber")
		.optional()
		.trim()
		.matches(/^[0-9]{10}$/)
		.withMessage("Please enter a valid 10-digit contact number"),
	body("collegeName")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("College name cannot exceed 100 characters"),
	handleValidationErrors,
];

// Login validation
const validateLogin = [
	body("email")
		.trim()
		.isEmail()
		.withMessage("Please enter a valid email")
		.normalizeEmail(),
	body("password").notEmpty().withMessage("Password is required"),
	handleValidationErrors,
];

// Organizer creation validation (by admin)
const validateOrganizerCreation = [
	body("loginEmail")
		.optional()
		.trim()
		.isEmail()
		.withMessage("Please enter a valid login email")
		.normalizeEmail(),
	body("password")
		.optional()
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Organizer name is required")
		.isLength({ max: 100 })
		.withMessage("Name cannot exceed 100 characters"),
	body("category")
		.trim()
		.notEmpty()
		.withMessage("Category is required")
		.isIn(["technical", "cultural", "sports", "literary", "gaming", "other"])
		.withMessage("Invalid category"),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Description cannot exceed 1000 characters"),
	body("contactEmail")
		.optional({ values: "falsy" })
		.trim()
		.isEmail()
		.withMessage("Please enter a valid contact email"),
	handleValidationErrors,
];

// Password change validation
const validatePasswordChange = [
	body("currentPassword")
		.notEmpty()
		.withMessage("Current password is required"),
	body("newPassword")
		.isLength({ min: 6 })
		.withMessage("New password must be at least 6 characters")
		.custom((value, { req }) => {
			if (value === req.body.currentPassword) {
				throw new Error("New password must be different from current password");
			}
			return true;
		}),
	handleValidationErrors,
];

module.exports = {
	handleValidationErrors,
	validateParticipantRegistration,
	validateLogin,
	validateOrganizerCreation,
	validatePasswordChange,
};
