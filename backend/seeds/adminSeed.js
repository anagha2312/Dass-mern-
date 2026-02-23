const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// Load env vars
dotenv.config();

const seedAdmin = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB Connected");

		// Check if admin already exists
		const existingAdmin = await User.findOne({ role: "admin" });

		if (existingAdmin) {
			console.log("Admin already exists:");
			console.log(`  Email: ${existingAdmin.email}`);
			console.log("  Skipping admin creation...");
		} else {
			// Create admin user
			const admin = await User.create({
				email: process.env.ADMIN_EMAIL || "admin@felicity.iiit.ac.in",
				password: process.env.ADMIN_PASSWORD || "Admin@123456",
				role: "admin",
				firstName: "System",
				lastName: "Admin",
				participantType: "iiit",
			});

			console.log("Admin created successfully!");
			console.log(`  Email: ${admin.email}`);
			console.log(
				`  Password: ${process.env.ADMIN_PASSWORD || "Admin@123456"}`,
			);
			console.log("  Please change the password after first login.");
		}

		process.exit(0);
	} catch (error) {
		console.error("Error seeding admin:", error.message);
		process.exit(1);
	}
};

seedAdmin();
