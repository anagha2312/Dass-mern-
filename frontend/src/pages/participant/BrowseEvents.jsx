import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/common";
import { participantAPI } from "../../services/api";
import toast from "react-hot-toast";

const BrowseEvents = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filters, setFilters] = useState({
		eventType: "",
		eligibility: "",
		startDate: "",
		endDate: "",
		followedOnly: false,
		sort: "eventStartDate",
	});

	useEffect(() => {
		fetchEvents();
	}, [filters]);

	const fetchEvents = async () => {
		try {
			setLoading(true);
			const params = {
				search: searchTerm,
				...filters,
			};

			// Remove empty values
			Object.keys(params).forEach((key) => {
				if (params[key] === "" || params[key] === false) {
					delete params[key];
				}
			});

			const response = await participantAPI.browseEvents(params);
			if (response.data.success) {
				setEvents(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching events:", error);
			toast.error("Failed to fetch events");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		fetchEvents();
	};

	const handleFilterChange = (key, value) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			eventType: "",
			eligibility: "",
			startDate: "",
			endDate: "",
			followedOnly: false,
			sort: "eventStartDate",
		});
		setSearchTerm("");
	};

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>Browse Events</h1>
						<p className='mt-2 text-gray-400'>
							Discover and register for upcoming events
						</p>
					</div>

					{/* Search Bar */}
					<form onSubmit={handleSearch} className='mb-6'>
						<div className='flex gap-2'>
							<input
								type='text'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder='Search events by name, organizer, or tags...'
								className='input-field flex-1'
							/>
							<button type='submit' className='btn-primary whitespace-nowrap'>
								Search
							</button>
						</div>
					</form>

					{/* Filters */}
					<div className='card mb-6'>
						<div className='flex flex-wrap gap-4 items-end'>
							{/* Event Type */}
							<div className='flex-1 min-w-[200px]'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Event Type
								</label>
								<select
									value={filters.eventType}
									onChange={(e) =>
										handleFilterChange("eventType", e.target.value)
									}
									className='input-field'>
									<option value=''>All Types</option>
									<option value='normal'>Normal Events</option>
									<option value='merchandise'>Merchandise</option>
								</select>
							</div>

							{/* Eligibility */}
							<div className='flex-1 min-w-[200px]'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Eligibility
								</label>
								<select
									value={filters.eligibility}
									onChange={(e) =>
										handleFilterChange("eligibility", e.target.value)
									}
									className='input-field'>
									<option value=''>All Events</option>
									<option value='all'>Open to All</option>
									<option value='iiit-only'>IIIT Only</option>
									<option value='non-iiit-only'>Non-IIIT Only</option>
								</select>
							</div>

							{/* Sort */}
							<div className='flex-1 min-w-[200px]'>
								<label className='block text-sm font-medium text-gray-300 mb-1'>
									Sort By
								</label>
								<select
									value={filters.sort}
									onChange={(e) => handleFilterChange("sort", e.target.value)}
									className='input-field'>
									<option value='eventStartDate'>Start Date</option>
									<option value='registrationDeadline'>
										Registration Deadline
									</option>
									<option value='trending'>Trending</option>
								</select>
							</div>

							{/* Followed Only */}
							<div className='flex items-center'>
								<label className='flex items-center cursor-pointer'>
									<input
										type='checkbox'
										checked={filters.followedOnly}
										onChange={(e) =>
											handleFilterChange("followedOnly", e.target.checked)
										}
										className='mr-2'
									/>
									<span className='text-sm text-gray-300'>
										Followed Clubs Only
									</span>
								</label>
							</div>

							{/* Clear Filters */}
							<button onClick={clearFilters} className='btn-secondary'>
								Clear Filters
							</button>
						</div>
					</div>

					{/* Events List */}
					{loading ? (
						<div className='text-center py-12'>
							<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
							<p className='mt-4 text-gray-400'>Loading events...</p>
						</div>
					) : events.length === 0 ? (
						<div className='card text-center py-12'>
							<p className='text-gray-400 text-lg'>No events found</p>
							<p className='text-gray-500 mt-2'>
								Try adjusting your search or filters
							</p>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{events.map((event) => (
								<Link
									key={event._id}
									to={`/events/${event._id}`}
									className='card hover:border-primary-500 transition-all duration-200 cursor-pointer'>
									<div className='flex justify-between items-start mb-3'>
										<h3 className='text-lg font-semibold text-white line-clamp-2'>
											{event.name}
										</h3>
										{event.isRegistered && (
											<span className='px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded ml-2 whitespace-nowrap'>
												Registered
											</span>
										)}
									</div>

									<p className='text-sm text-gray-400 mb-3 line-clamp-2'>
										{event.description}
									</p>

									<div className='flex items-center text-sm text-gray-500 mb-2'>
										<svg
											className='w-4 h-4 mr-1'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
											/>
										</svg>
										{event.organizer?.name}
									</div>

									<div className='flex items-center text-sm text-gray-500 mb-3'>
										<svg
											className='w-4 h-4 mr-1'
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
										{new Date(event.eventStartDate).toLocaleDateString()}
									</div>

									<div className='flex justify-between items-center pt-3 border-t border-gray-700'>
										<span
											className={`px-2 py-1 text-xs rounded ${event.eventType === "merchandise" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
											{event.eventType === "merchandise"
												? "Merchandise"
												: "Event"}
										</span>
										<span className='text-sm font-semibold text-primary-400'>
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
			</main>
		</div>
	);
};

export default BrowseEvents;
