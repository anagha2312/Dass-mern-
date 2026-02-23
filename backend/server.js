const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const {
	authRoutes,
	adminRoutes,
	participantRoutes,
	organizerRoutes,
} = require("./routes");
const discussionRoutes = require("./routes/discussion");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	},
});

// Make io accessible to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	// Join event discussion room
	socket.on("join_event", (eventId) => {
		socket.join(`event:${eventId}`);
		console.log(`Socket ${socket.id} joined event:${eventId}`);
	});

	// Leave event discussion room
	socket.on("leave_event", (eventId) => {
		socket.leave(`event:${eventId}`);
		console.log(`Socket ${socket.id} left event:${eventId}`);
	});

	// Handle typing indicator
	socket.on("typing", ({ eventId, userName }) => {
		socket.to(`event:${eventId}`).emit("user_typing", { userName });
	});

	socket.on("stop_typing", ({ eventId }) => {
		socket.to(`event:${eventId}`).emit("user_stop_typing");
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

// CORS configuration
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	}),
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/participant", participantRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/discussion", discussionRoutes);

// Health check route
app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Felicity API is running",
		timestamp: new Date().toISOString(),
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		message: "Internal server error",
		error: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(
		`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
	);
	console.log(`Socket.IO enabled for real-time features`);
});
