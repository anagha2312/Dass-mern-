import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { Loading } from "../../components/common";
import toast from "react-hot-toast";

const OngoingEvents = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("all"); // all, published, draft, past
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			const response = await organizerAPI.getEvents();
			setEvents(response.data.events || []);
		} catch (error) {
			toast.error("Failed to load events");
		} finally {
			setLoading(false);
		}
	};

	const getEventStatus = (event) => {
		const now = new Date();
		const startDate = new Date(event.eventStartDate);
		const endDate = new Date(event.eventEndDate);

		if (event.status === "draft") return "draft";
		if (event.status === "cancelled") return "cancelled";
		if (event.status === "completed") return "completed";
		if (now < startDate) return "upcoming";
		if (now >= startDate && now <= endDate) return "ongoing";
		return "past";
	};

	const getStatusBadge = (status) => {
		const badges = {
			draft: "bg-gray-600 text-gray-200",
			upcoming: "bg-blue-600 text-blue-200",
			ongoing: "bg-green-600 text-green-200",
			past: "bg-yellow-600 text-yellow-200",
			cancelled: "bg-red-600 text-red-200",
			completed: "bg-purple-600 text-purple-200",
		};
		return badges[status] || "bg-gray-600";
	};

	const filteredEvents = events.filter((event) => {
		const eventStatus = getEventStatus(event);

		// Apply status filter
		if (filter !== "all") {
			if (filter === "published" && event.status !== "published") return false;
			if (filter === "draft" && event.status !== "draft") return false;
			if (filter === "past" && eventStatus !== "past") return false;
			if (
				filter === "ongoing" &&
				eventStatus !== "ongoing" &&
				eventStatus !== "upcoming"
			)
				return false;
		}

		// Apply search filter
		if (searchQuery) {
			return (
				event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				event.description?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return true;
	});

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleDeleteEvent = async (eventId) => {
		if (!confirm("Are you sure you want to delete this event?")) return;

		try {
			await organizerAPI.deleteEvent(eventId);
			toast.success("Event deleted successfully");
			fetchEvents();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete event");
		}
	};

	const handleTogglePublish = async (eventId, currentStatus) => {
		try {
			const newStatus = currentStatus === "published" ? "draft" : "published";
			await organizerAPI.updateEvent(eventId, { status: newStatus });
			toast.success(
				currentStatus === "published" ? "Event unpublished" : "Event published",
			);
			fetchEvents();
		} catch (error) {
			toast.error("Failed to update event");
		}
	};

	if (loading) return <Loading />;

	return (
		<div className='min-h-screen bg-gray-900 py-8'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
					<div>
						<h1 className='text-3xl font-bold text-white'>My Events</h1>
						<p className='text-gray-400 mt-1'>Manage all your events</p>
					</div>
					<Link
						to='/organizer/events/new'
						className='px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2'>
						<svg
							className='w-5 h-5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 4v16m8-8H4'
							/>
						</svg>
						Create Event
					</Link>
				</div>

				{/* Filters */}
				<div className='bg-gray-800 rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<input
							type='text'
							placeholder='Search events...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
						/>
					</div>
					<div className='flex gap-2 flex-wrap'>
						{["all", "ongoing", "published", "draft", "past"].map((f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
									filter === f
										? "bg-primary-600 text-white"
										: "bg-gray-700 text-gray-300 hover:bg-gray-600"
								}`}>
								{f}
							</button>
						))}
					</div>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8'>
					<div className='bg-gray-800 rounded-lg p-4'>
						<p className='text-gray-400 text-sm'>Total Events</p>
						<p className='text-2xl font-bold text-white'>{events.length}</p>
					</div>
					<div className='bg-gray-800 rounded-lg p-4'>
						<p className='text-gray-400 text-sm'>Published</p>
						<p className='text-2xl font-bold text-green-400'>
							{events.filter((e) => e.status === "published").length}
						</p>
					</div>
					<div className='bg-gray-800 rounded-lg p-4'>
						<p className='text-gray-400 text-sm'>Drafts</p>
						<p className='text-2xl font-bold text-yellow-400'>
							{events.filter((e) => e.status === "draft").length}
						</p>
					</div>
					<div className='bg-gray-800 rounded-lg p-4'>
						<p className='text-gray-400 text-sm'>Total Registrations</p>
						<p className='text-2xl font-bold text-blue-400'>
							{events.reduce(
								(acc, e) => acc + (e.currentRegistrations || 0),
								0,
							)}
						</p>
					</div>
				</div>

				{/* Events List */}
				{filteredEvents.length === 0 ? (
					<div className='bg-gray-800 rounded-lg p-12 text-center'>
						<svg
							className='w-16 h-16 mx-auto text-gray-600 mb-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
							/>
						</svg>
						<h3 className='text-xl font-semibold text-white mb-2'>
							No events found
						</h3>
						<p className='text-gray-400 mb-6'>
							{filter === "all"
								? "Create your first event to get started"
								: `No ${filter} events found`}
						</p>
						<Link
							to='/organizer/events/new'
							className='inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'>
							<svg
								className='w-5 h-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 4v16m8-8H4'
								/>
							</svg>
							Create Event
						</Link>
					</div>
				) : (
					<div className='grid gap-4'>
						{filteredEvents.map((event) => {
							const status = getEventStatus(event);
							return (
								<div
									key={event._id}
									className='bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors'>
									<div className='flex flex-col lg:flex-row gap-6'>
										{/* Event Image */}
										{event.imageUrl && (
											<div className='lg:w-48 lg:h-32 flex-shrink-0'>
												<img
													src={event.imageUrl}
													alt={event.name}
													className='w-full h-32 lg:h-full object-cover rounded-lg'
												/>
											</div>
										)}

										{/* Event Details */}
										<div className='flex-1'>
											<div className='flex flex-wrap items-start gap-2 mb-2'>
												<h3 className='text-xl font-semibold text-white'>
													{event.name}
												</h3>
												<span
													className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadge(
														status,
													)}`}>
													{status}
												</span>
												{event.eventType && (
													<span className='px-2 py-1 text-xs rounded-full bg-purple-600 text-purple-200 capitalize'>
														{event.eventType}
													</span>
												)}
											</div>

											<p className='text-gray-400 text-sm mb-3 line-clamp-2'>
												{event.description || "No description"}
											</p>

											<div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm'>
												<div>
													<p className='text-gray-500'>Start Date</p>
													<p className='text-white'>
														{formatDate(event.eventStartDate)}
													</p>
												</div>
												<div>
													<p className='text-gray-500'>End Date</p>
													<p className='text-white'>
														{formatDate(event.eventEndDate)}
													</p>
												</div>
												<div>
													<p className='text-gray-500'>Registrations</p>
													<p className='text-white'>
														{event.currentRegistrations || 0}
														{event.registrationLimit &&
															` / ${event.registrationLimit}`}
													</p>
												</div>
												<div>
													<p className='text-gray-500'>Venue</p>
													<p className='text-white'>
														{event.venue || "Not specified"}
													</p>
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className='flex lg:flex-col gap-2 justify-end'>
											<Link
												to={`/organizer/events/${event._id}`}
												className='px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm text-center'>
												Manage
											</Link>
											<Link
												to={`/organizer/events/${event._id}/edit`}
												className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm text-center'>
												Edit
											</Link>
											<button
												onClick={() =>
													handleTogglePublish(event._id, event.status)
												}
												className={`px-4 py-2 rounded-lg text-sm transition-colors ${
													event.status === "published"
														? "bg-yellow-600 text-white hover:bg-yellow-700"
														: "bg-green-600 text-white hover:bg-green-700"
												}`}>
												{event.status === "published" ? "Unpublish" : "Publish"}
											</button>
											{event.status === "draft" && (
												<button
													onClick={() => handleDeleteEvent(event._id)}
													className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm'>
													Delete
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default OngoingEvents;
