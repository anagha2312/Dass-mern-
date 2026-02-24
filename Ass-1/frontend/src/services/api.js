import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://dass-mern.onrender.com/api";

// Create axios instance
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor to handle errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid
			localStorage.removeItem("token");
			localStorage.removeItem("user");

			// Only redirect if not already on login page
			if (!window.location.pathname.includes("/login")) {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

// Auth API calls
export const authAPI = {
	register: (data) => api.post("/auth/register", data),
	login: (data) => api.post("/auth/login", data),
	logout: () => api.post("/auth/logout"),
	getMe: () => api.get("/auth/me"),
	changePassword: (data) => api.put("/auth/change-password", data),
	requestPasswordReset: (data) =>
		api.post("/auth/request-password-reset", data),
};

// Admin API calls
export const adminAPI = {
	getOrganizers: (params) => api.get("/admin/organizers", { params }),
	getOrganizer: (id) => api.get(`/admin/organizers/${id}`),
	createOrganizer: (data) => api.post("/admin/organizers", data),
	updateOrganizer: (id, data) => api.put(`/admin/organizers/${id}`, data),
	deleteOrganizer: (id, permanent = false) =>
		api.delete(`/admin/organizers/${id}?permanent=${permanent}`),
	resetOrganizerPassword: (id, data) =>
		api.put(`/admin/organizers/${id}/reset-password`, data),
	getPasswordRequests: () => api.get("/admin/password-requests"),
	handlePasswordRequest: (id, data) =>
		api.put(`/admin/password-requests/${id}`, data),
	getDashboardStats: () => api.get("/admin/dashboard"),
};

// Participant API calls
export const participantAPI = {
	// Profile & Preferences
	getProfile: () => api.get("/participant/profile"),
	updateProfile: (data) => api.put("/participant/profile", data),
	updatePreferences: (data) => api.put("/participant/preferences", data),

	// Events
	browseEvents: (params) => api.get("/participant/events", { params }),
	getTrendingEvents: () => api.get("/participant/events/trending"),
	getEventDetails: (id) => api.get(`/participant/events/${id}`),
	registerForEvent: (id, data) =>
		api.post(`/participant/events/${id}/register`, data),

	// Feedback & Calendar
	submitFeedback: (eventId, data) =>
		api.post(`/participant/events/${eventId}/feedback`, data),
	getCalendarFile: (eventId) =>
		api.get(`/participant/events/${eventId}/calendar`, {
			responseType: "blob",
		}),
	getGoogleCalendarLink: (eventId) =>
		api.get(`/participant/events/${eventId}/google-calendar`),

	// Registrations
	getMyRegistrations: (params) =>
		api.get("/participant/registrations", { params }),
	cancelRegistration: (id) => api.delete(`/participant/registrations/${id}`),
	uploadPaymentProof: (registrationId, data) =>
		api.post(
			`/participant/registrations/${registrationId}/payment-proof`,
			data,
		),

	// Organizers
	getAllOrganizers: (params) => api.get("/participant/organizers", { params }),
	getOrganizerDetails: (id) => api.get(`/participant/organizers/${id}`),
	toggleFollowOrganizer: (id) =>
		api.post(`/participant/organizers/${id}/follow`),
};

// Organizer API calls
export const organizerAPI = {
	getDashboardStats: () => api.get("/organizer/dashboard"),
	getEvents: (params) => api.get("/organizer/events", { params }),
	getEvent: (id) => api.get(`/organizer/events/${id}`),
	createEvent: (data) => api.post("/organizer/events", data),
	updateEvent: (id, data) => api.put(`/organizer/events/${id}`, data),
	deleteEvent: (id) => api.delete(`/organizer/events/${id}`),
	getEventRegistrations: (id, params) =>
		api.get(`/organizer/events/${id}/registrations`, { params }),
	updateRegistrationStatus: (eventId, registrationId, status) =>
		api.put(`/organizer/events/${eventId}/registrations/${registrationId}`, {
			status,
		}),
	markAttendance: (eventId, registrationId) =>
		api.put(
			`/organizer/events/${eventId}/registrations/${registrationId}/attendance`,
		),
	getProfile: () => api.get("/organizer/profile"),
	updateProfile: (data) => api.put("/organizer/profile", data),
	changePassword: (data) => api.put("/organizer/change-password", data),

	// Payment Approval Workflow
	getPendingPayments: (eventId) =>
		api.get(`/organizer/events/${eventId}/pending-payments`),
	handlePaymentApproval: (eventId, registrationId, data) =>
		api.put(`/organizer/events/${eventId}/payments/${registrationId}`, data),

	// QR Scanner & Attendance
	scanQRCode: (eventId, data) =>
		api.post(`/organizer/events/${eventId}/scan-qr`, data),
	getAttendanceStats: (eventId) =>
		api.get(`/organizer/events/${eventId}/attendance`),

	// Feedback
	getEventFeedback: (eventId, params) =>
		api.get(`/organizer/events/${eventId}/feedback`, { params }),
};

export default api;
