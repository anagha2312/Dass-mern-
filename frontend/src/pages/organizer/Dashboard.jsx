import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "../../components/common";
import { organizerAPI } from "../../services/api";
import toast from "react-hot-toast";

const OrganizerDashboard = () => {
	const { user } = useAuth();
	const [stats, setStats] = useState({
		totalEvents: 0,
		activeEvents: 0,
		draftEvents: 0,
		totalRegistrations: 0,
		totalRevenue: 0,
		totalAttendance: 0,
	});
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const carouselRef = useRef(null);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const [dashboardRes, eventsRes] = await Promise.all([
				organizerAPI.getDashboardStats(),
				organizerAPI.getEvents(),
			]);

			if (dashboardRes.data.success) {
				setStats(dashboardRes.data.data.stats);
			}

			if (eventsRes.data.success) {
				setEvents(eventsRes.data.data);
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			toast.error("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	const scrollCarousel = (direction) => {
		if (carouselRef.current) {
			const scrollAmount = 320;
			carouselRef.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "draft":
				return "bg-gray-500/20 text-gray-400";
			case "published":
				return "bg-green-500/20 text-green-400";
			case "cancelled":
				return "bg-red-500/20 text-red-400";
			case "completed":
				return "bg-blue-500/20 text-blue-400";
			default:
				return "bg-gray-500/20 text-gray-400";
		}
	};

	const getEventStatusLabel = (event) => {
		const now = new Date();
		const start = new Date(event.eventStartDate);
		const end = new Date(event.eventEndDate);

		if (event.status === "draft") return "Draft";
		if (event.status === "cancelled") return "Cancelled";
		if (event.status === "completed") return "Completed";
		if (now >= start && now <= end) return "Ongoing";
		if (now > end) return "Completed";
		return "Published";
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='max-w-7xl mx-auto py-12 text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
					<p className='mt-4 text-gray-400'>Loading dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Welcome Section */}
					<div className='card mb-6'>
						<h1 className='text-3xl font-bold text-white'>
							{user?.name} Dashboard
						</h1>
						<p className='mt-2 text-gray-400'>
							Manage your events and track registrations.
						</p>
					</div>

					{/* Quick Stats */}
					<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Total Events
							</h3>
							<p className='text-3xl font-bold text-white mt-2'>
								{stats.totalEvents}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Active Events
							</h3>
							<p className='text-3xl font-bold text-green-400 mt-2'>
								{stats.activeEvents}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Total Registrations
							</h3>
							<p className='text-3xl font-bold text-blue-400 mt-2'>
								{stats.totalRegistrations}
							</p>
						</div>
						<div className='card'>
							<h3 className='text-lg font-medium text-gray-400'>
								Draft Events
							</h3>
							<p className='text-3xl font-bold text-yellow-400 mt-2'>
								{stats.draftEvents}
							</p>
						</div>
					</div>

					{/* Events Carousel */}
					<div className='card mb-6'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold text-white'>My Events</h2>
							<div className='flex gap-2'>
								<button
									onClick={() => scrollCarousel("left")}
									className='p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition'>
									<svg
										className='w-5 h-5 text-white'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M15 19l-7-7 7-7'
										/>
									</svg>
								</button>
								<button
									onClick={() => scrollCarousel("right")}
									className='p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition'>
									<svg
										className='w-5 h-5 text-white'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M9 5l7 7-7 7'
										/>
									</svg>
								</button>
								<Link to='/organizer/events/new' className='btn-primary ml-2'>
									+ Create Event
								</Link>
							</div>
						</div>

						{events.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								<p>No events created yet</p>
								<p className='text-sm mt-2'>
									Create your first event to get started!
								</p>
							</div>
						) : (
							<div
								ref={carouselRef}
								className='flex gap-4 overflow-x-auto pb-4 scrollbar-hide'
								style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
								{events.map((event) => (
									<Link
										key={event._id}
										to={`/organizer/events/${event._id}`}
										className='flex-shrink-0 w-80 border border-gray-700 rounded-lg p-4 hover:border-primary-500 transition'>
										<div className='flex justify-between items-start mb-3'>
											<h3 className='text-lg font-semibold text-white line-clamp-1'>
												{event.name}
											</h3>
											<span
												className={`px-2 py-1 text-xs rounded ${getStatusColor(event.status)}`}>
												{getEventStatusLabel(event)}
											</span>
										</div>

										<p className='text-sm text-gray-400 mb-3 line-clamp-2'>
											{event.description}
										</p>

										<div className='flex justify-between text-sm text-gray-500 mb-2'>
											<span
												className={`px-2 py-1 text-xs rounded ${event.eventType === "merchandise" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
												{event.eventType === "merchandise"
													? "Merchandise"
													: "Normal"}
											</span>
											<span>
												{new Date(event.eventStartDate).toLocaleDateString()}
											</span>
										</div>

										<div className='flex justify-between items-center text-sm pt-3 border-t border-gray-700'>
											<span className='text-gray-400'>
												{event.currentRegistrations || 0} /{" "}
												{event.registrationLimit || "∞"} registered
											</span>
											<span className='text-primary-400'>
												{event.registrationFee > 0
													? `₹${event.registrationFee}`
													: "Free"}
											</span>
										</div>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Event Analytics (for completed events) */}
					<div className='card'>
						<h2 className='text-xl font-semibold text-white mb-4'>
							Event Analytics
						</h2>

						{events.filter(
							(e) =>
								e.status === "completed" ||
								new Date(e.eventEndDate) < new Date(),
						).length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								<p>No completed events yet</p>
								<p className='text-sm mt-2'>
									Analytics will appear here once events are completed.
								</p>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full text-left'>
									<thead>
										<tr className='border-b border-gray-700'>
											<th className='pb-3 text-gray-400 font-medium'>Event</th>
											<th className='pb-3 text-gray-400 font-medium'>Date</th>
											<th className='pb-3 text-gray-400 font-medium'>
												Registrations
											</th>
											<th className='pb-3 text-gray-400 font-medium'>
												Revenue
											</th>
											<th className='pb-3 text-gray-400 font-medium'>
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{events
											.filter(
												(e) =>
													e.status === "completed" ||
													new Date(e.eventEndDate) < new Date(),
											)
											.map((event) => (
												<tr
													key={event._id}
													className='border-b border-gray-800'>
													<td className='py-3 text-white'>{event.name}</td>
													<td className='py-3 text-gray-400'>
														{new Date(
															event.eventStartDate,
														).toLocaleDateString()}
													</td>
													<td className='py-3 text-gray-400'>
														{event.currentRegistrations || 0}
													</td>
													<td className='py-3 text-green-400'>
														₹
														{(event.currentRegistrations || 0) *
															(event.registrationFee || 0)}
													</td>
													<td className='py-3'>
														<Link
															to={`/organizer/events/${event._id}`}
															className='text-primary-400 hover:text-primary-300'>
															View Details
														</Link>
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default OrganizerDashboard;
