import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute, Loading } from "./components/common";

// Auth Pages
import { Login, Register } from "./pages/auth";

// Participant Pages
import {
	Dashboard as ParticipantDashboard,
	Onboarding,
	BrowseEvents,
	EventDetails,
	Profile,
	ClubsListing,
	ClubDetails,
} from "./pages/participant";

// Organizer Pages
import {
	Dashboard as OrganizerDashboard,
	CreateEvent,
	EditEvent,
	EventDetail as OrganizerEventDetail,
	OngoingEvents,
	Profile as OrganizerProfile,
	QRScanner,
	PaymentApproval,
	EventFeedback,
} from "./pages/organizer";

// Admin Pages
import {
	Dashboard as AdminDashboard,
	OrganizerManagement,
	PasswordRequests,
} from "./pages/admin";

function App() {
	const { loading } = useAuth();

	if (loading) {
		return <Loading fullScreen />;
	}

	return (
		<>
			{/* Toast notifications */}
			<Toaster
				position='top-right'
				toastOptions={{
					duration: 3000,
					style: {
						background: "#1f2937",
						color: "#fff",
						border: "1px solid #374151",
					},
					success: {
						iconTheme: {
							primary: "#10b981",
							secondary: "#fff",
						},
					},
					error: {
						iconTheme: {
							primary: "#ef4444",
							secondary: "#fff",
						},
					},
				}}
			/>

			<Routes>
				{/* Public Routes (Login/Register) */}
				<Route
					path='/login'
					element={
						<PublicRoute>
							<Login />
						</PublicRoute>
					}
				/>
				<Route
					path='/register'
					element={
						<PublicRoute>
							<Register />
						</PublicRoute>
					}
				/>

				{/* Participant Routes */}
				<Route
					path='/dashboard'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<ParticipantDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/onboarding'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<Onboarding />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/events'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<BrowseEvents />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/events/:id'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<EventDetails />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/profile'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<Profile />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/clubs'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<ClubsListing />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/clubs/:id'
					element={
						<ProtectedRoute allowedRoles={["participant"]}>
							<ClubDetails />
						</ProtectedRoute>
					}
				/>

				{/* Organizer Routes */}
				<Route
					path='/organizer/dashboard'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<OrganizerDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/new'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<CreateEvent />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/ongoing'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<OngoingEvents />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/:eventId'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<OrganizerEventDetail />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/:eventId/edit'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<EditEvent />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/:eventId/scanner'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<QRScanner />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/:eventId/payments'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<PaymentApproval />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/events/:eventId/feedback'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<EventFeedback />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/organizer/profile'
					element={
						<ProtectedRoute allowedRoles={["organizer"]}>
							<OrganizerProfile />
						</ProtectedRoute>
					}
				/>

				{/* Admin Routes */}
				<Route
					path='/admin/dashboard'
					element={
						<ProtectedRoute allowedRoles={["admin"]}>
							<AdminDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/admin/organizers'
					element={
						<ProtectedRoute allowedRoles={["admin"]}>
							<OrganizerManagement />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/admin/password-requests'
					element={
						<ProtectedRoute allowedRoles={["admin"]}>
							<PasswordRequests />
						</ProtectedRoute>
					}
				/>

				{/* Root redirect */}
				<Route path='/' element={<Navigate to='/login' replace />} />

				{/* 404 - Not Found */}
				<Route
					path='*'
					element={
						<div className='min-h-screen flex items-center justify-center bg-gray-900'>
							<div className='text-center'>
								<h1 className='text-6xl font-bold text-primary-500'>404</h1>
								<p className='mt-4 text-xl text-gray-400'>Page not found</p>
								<a href='/login' className='mt-6 inline-block btn-primary'>
									Go Home
								</a>
							</div>
						</div>
					}
				/>
			</Routes>
		</>
	);
}

export default App;
