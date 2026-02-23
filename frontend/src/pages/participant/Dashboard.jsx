import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "../../components/common";
import { participantAPI } from "../../services/api";
import toast from "react-hot-toast";

const ParticipantDashboard = () => {
	const { user } = useAuth();
	const [registrations, setRegistrations] = useState({
		upcoming: [],
		completed: [],
		cancelled: [],
		normal: [],
		merchandise: [],
	});
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("upcoming");
	const [showTicketModal, setShowTicketModal] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState(null);

	useEffect(() => {
		fetchRegistrations();
	}, []);

	const fetchRegistrations = async () => {
		try {
			setLoading(true);
			const response = await participantAPI.getMyRegistrations();
			if (response.data.success) {
				const data = response.data.data;
				// Categorize by event type as well
				const normal =
					data.all?.filter((reg) => reg.event?.eventType === "normal") || [];
				const merchandise =
					data.all?.filter((reg) => reg.event?.eventType === "merchandise") ||
					[];
				setRegistrations({
					...data,
					normal,
					merchandise,
				});
			}
		} catch (error) {
			console.error("Error fetching registrations:", error);
			toast.error("Failed to fetch registrations");
		} finally {
			setLoading(false);
		}
	};

	const viewTicket = (registration) => {
		setSelectedTicket(registration);
		setShowTicketModal(true);
	};

	const renderRegistrations = (registrationsList) => {
		if (registrationsList.length === 0) {
			return (
				<div className='text-center py-8 text-gray-500'>
					<p>No events in this category</p>
				</div>
			);
		}

		return (
			<div className='space-y-4'>
				{registrationsList.map((reg) => (
					<div
						key={reg._id}
						className='border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition'>
						<div className='flex justify-between items-start mb-2'>
							<div className='flex-1'>
								<Link
									to={`/events/${reg.event?._id}`}
									className='text-lg font-semibold text-white hover:text-primary-400'>
									{reg.event?.name}
								</Link>
								<p className='text-sm text-gray-400 mt-1'>
									Organized by {reg.event?.organizer?.name}
								</p>
							</div>
							<div className='flex items-center gap-2'>
								<span
									className={`px-2 py-1 text-xs rounded ${reg.event?.eventType === "merchandise" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
									{reg.event?.eventType === "merchandise"
										? "Merchandise"
										: "Event"}
								</span>
								<span
									className={`px-3 py-1 text-xs rounded font-medium ${
										reg.status === "confirmed"
											? "bg-green-500/20 text-green-400"
											: reg.status === "pending"
												? "bg-yellow-500/20 text-yellow-400"
												: reg.status === "cancelled"
													? "bg-red-500/20 text-red-400"
													: reg.status === "attended"
														? "bg-purple-500/20 text-purple-400"
														: "bg-gray-500/20 text-gray-400"
									}`}>
									{reg.status}
								</span>
							</div>
						</div>

						<div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3'>
							<div>
								<p className='text-gray-500'>Ticket ID</p>
								<button
									onClick={() => viewTicket(reg)}
									className='text-primary-400 font-mono hover:text-primary-300 cursor-pointer'>
									{reg.ticketId}
								</button>
							</div>
							<div>
								<p className='text-gray-500'>Event Date</p>
								<p className='text-white'>
									{reg.event?.eventStartDate
										? new Date(reg.event.eventStartDate).toLocaleDateString()
										: "N/A"}
								</p>
							</div>
							<div>
								<p className='text-gray-500'>Registered On</p>
								<p className='text-white'>
									{new Date(reg.createdAt).toLocaleDateString()}
								</p>
							</div>
							<div>
								<p className='text-gray-500'>Payment</p>
								<p className='text-white'>
									{reg.paymentStatus === "completed"
										? "✓ Paid"
										: reg.paymentStatus}
								</p>
							</div>
						</div>

						{reg.merchandiseDetails && (
							<div className='mt-3 p-3 bg-gray-800/50 rounded'>
								<p className='text-sm text-gray-400'>Merchandise Purchase</p>
								<p className='text-white'>
									{reg.merchandiseDetails.variantName} x{" "}
									{reg.merchandiseDetails.quantity}
								</p>
								<p className='text-primary-400 font-semibold'>
									₹{reg.merchandiseDetails.totalPrice}
								</p>
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	// Ticket Modal Component
	const TicketModal = () => {
		if (!selectedTicket) return null;

		return (
			<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
				<div className='bg-gray-800 rounded-xl max-w-md w-full p-6 relative'>
					<button
						onClick={() => setShowTicketModal(false)}
						className='absolute top-4 right-4 text-gray-400 hover:text-white'>
						<svg
							className='w-6 h-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>

					<h3 className='text-xl font-bold text-white mb-4'>Event Ticket</h3>

					{/* QR Code */}
					{selectedTicket.qrCode && (
						<div className='flex justify-center mb-4'>
							<img
								src={selectedTicket.qrCode}
								alt='Ticket QR Code'
								className='w-48 h-48 rounded-lg'
							/>
						</div>
					)}

					<div className='space-y-3 text-sm'>
						<div className='flex justify-between'>
							<span className='text-gray-400'>Ticket ID:</span>
							<span className='text-white font-mono'>
								{selectedTicket.ticketId}
							</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-400'>Event:</span>
							<span className='text-white'>{selectedTicket.event?.name}</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-400'>Date:</span>
							<span className='text-white'>
								{new Date(
									selectedTicket.event?.eventStartDate,
								).toLocaleDateString()}
							</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-400'>Status:</span>
							<span className='text-green-400 capitalize'>
								{selectedTicket.status}
							</span>
						</div>
						{selectedTicket.merchandiseDetails && (
							<>
								<div className='flex justify-between'>
									<span className='text-gray-400'>Item:</span>
									<span className='text-white'>
										{selectedTicket.merchandiseDetails.variantName}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-400'>Quantity:</span>
									<span className='text-white'>
										{selectedTicket.merchandiseDetails.quantity}
									</span>
								</div>
							</>
						)}
					</div>

					<p className='text-xs text-gray-500 mt-4 text-center'>
						Present this QR code at the event venue for check-in
					</p>
				</div>
			</div>
		);
	};

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Welcome Section */}
					<div className='card mb-6'>
						<h1 className='text-3xl font-bold text-white'>
							Welcome, {user?.firstName}! 👋
						</h1>
						<p className='mt-2 text-gray-400'>
							Here's what's happening with your events.
						</p>
					</div>

					{/* Quick Actions */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
						<Link
							to='/events'
							className='card hover:border-primary-500 transition'>
							<h3 className='text-lg font-medium text-white mb-2'>
								Browse Events
							</h3>
							<p className='text-gray-400 text-sm'>Discover upcoming events</p>
						</Link>
						<Link
							to='/clubs'
							className='card hover:border-primary-500 transition'>
							<h3 className='text-lg font-medium text-white mb-2'>
								Clubs & Organizers
							</h3>
							<p className='text-gray-400 text-sm'>
								Follow your favorite clubs
							</p>
						</Link>
						<Link
							to='/profile'
							className='card hover:border-primary-500 transition'>
							<h3 className='text-lg font-medium text-white mb-2'>
								Edit Profile
							</h3>
							<p className='text-gray-400 text-sm'>Update your information</p>
						</Link>
					</div>

					{/* Quick Stats */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Upcoming Events
							</h3>
							<p className='text-3xl font-bold text-white mt-2'>
								{registrations.upcoming.length}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Completed Events
							</h3>
							<p className='text-3xl font-bold text-white mt-2'>
								{registrations.completed.length}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Cancelled/Rejected
							</h3>
							<p className='text-3xl font-bold text-white mt-2'>
								{registrations.cancelled.length}
							</p>
						</div>
					</div>

					{/* My Events Section with Tabs */}
					<div className='card'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold text-white'>My Events</h2>
						</div>

						{/* Tabs */}
						<div className='flex flex-wrap border-b border-gray-700 mb-4'>
							<button
								onClick={() => setActiveTab("upcoming")}
								className={`px-4 py-2 font-medium transition ${
									activeTab === "upcoming"
										? "text-primary-400 border-b-2 border-primary-400"
										: "text-gray-400 hover:text-gray-300"
								}`}>
								Upcoming ({registrations.upcoming.length})
							</button>
							<button
								onClick={() => setActiveTab("normal")}
								className={`px-4 py-2 font-medium transition ${
									activeTab === "normal"
										? "text-primary-400 border-b-2 border-primary-400"
										: "text-gray-400 hover:text-gray-300"
								}`}>
								Normal ({registrations.normal.length})
							</button>
							<button
								onClick={() => setActiveTab("merchandise")}
								className={`px-4 py-2 font-medium transition ${
									activeTab === "merchandise"
										? "text-primary-400 border-b-2 border-primary-400"
										: "text-gray-400 hover:text-gray-300"
								}`}>
								Merchandise ({registrations.merchandise.length})
							</button>
							<button
								onClick={() => setActiveTab("completed")}
								className={`px-4 py-2 font-medium transition ${
									activeTab === "completed"
										? "text-primary-400 border-b-2 border-primary-400"
										: "text-gray-400 hover:text-gray-300"
								}`}>
								Completed ({registrations.completed.length})
							</button>
							<button
								onClick={() => setActiveTab("cancelled")}
								className={`px-4 py-2 font-medium transition ${
									activeTab === "cancelled"
										? "text-primary-400 border-b-2 border-primary-400"
										: "text-gray-400 hover:text-gray-300"
								}`}>
								Cancelled/Rejected ({registrations.cancelled.length})
							</button>
						</div>

						{/* Tab Content */}
						{loading ? (
							<div className='text-center py-8'>
								<div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500'></div>
								<p className='text-gray-400 mt-2'>Loading...</p>
							</div>
						) : (
							<div>
								{activeTab === "upcoming" &&
									renderRegistrations(registrations.upcoming)}
								{activeTab === "normal" &&
									renderRegistrations(registrations.normal)}
								{activeTab === "merchandise" &&
									renderRegistrations(registrations.merchandise)}
								{activeTab === "completed" &&
									renderRegistrations(registrations.completed)}
								{activeTab === "cancelled" &&
									renderRegistrations(registrations.cancelled)}
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Ticket Modal */}
			{showTicketModal && <TicketModal />}
		</div>
	);
};

export default ParticipantDashboard;
