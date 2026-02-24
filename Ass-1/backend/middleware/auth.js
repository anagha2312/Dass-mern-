const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organizer = require("../models/Organizer");

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
	try {
		let token;

		// Check for token in header or cookies
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route. Please login.",
			});
		}

		try {
			// Verify token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Check if it's a user (participant/admin) or organizer
			if (decoded.role === "organizer") {
				const organizer = await Organizer.findById(decoded.id);

				if (!organizer) {
					return res.status(401).json({
						success: false,
						message: "Organizer not found",
					});
				}

				if (!organizer.isActive) {
					return res.status(401).json({
						success: false,
						message: "Organizer account has been deactivated",
					});
				}

				req.user = {
					id: organizer._id,
					email: organizer.loginEmail,
					role: "organizer",
					name: organizer.name,
				};
			} else {
				const user = await User.findById(decoded.id);

				if (!user) {
					return res.status(401).json({
						success: false,
						message: "User not found",
					});
				}

				req.user = {
					id: user._id,
					email: user.email,
					role: user.role,
					participantType: user.participantType,
				};
			}

			next();
		} catch (error) {
			return res.status(401).json({
				success: false,
				message: "Token is invalid or expired",
			});
		}
	} catch (error) {
		console.error("Auth middleware error:", error);
		return res.status(500).json({
			success: false,
			message: "Server error in authentication",
		});
	}
};

// Role-based access control
const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `Role '${req.user.role}' is not authorized to access this route`,
			});
		}

		next();
	};
};

// Generate JWT token
const generateToken = (id, role) => {
	return jwt.sign({ id, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	});
};

// Set token in cookie
const sendTokenResponse = (user, statusCode, res, role = "participant") => {
	const token = generateToken(user._id, role);

	const isProduction = process.env.NODE_ENV === "production";
	const options = {
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "none" : "lax",
	};

	// Build user response based on role
	let userData;
	if (role === "organizer") {
		userData = {
			id: user._id,
			email: user.loginEmail,
			role: "organizer",
			name: user.name,
			category: user.category,
		};
	} else {
		userData = {
			id: user._id,
			email: user.email,
			role: user.role,
			firstName: user.firstName,
			lastName: user.lastName,
			participantType: user.participantType,
			onboardingCompleted: user.onboardingCompleted,
		};
	}

	res.status(statusCode).cookie("token", token, options).json({
		success: true,
		token,
		user: userData,
	});
};

module.exports = {
	protect,
	authorize,
	generateToken,
	sendTokenResponse,
};
