import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/common";
import { participantAPI } from "../../services/api";
import toast from "react-hot-toast";

const ClubsListing = () => {
	const [organizers, setOrganizers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState("");

	useEffect(() => {
		fetchOrganizers();
	}, [filter]);

	const fetchOrganizers = async () => {
		try {
			setLoading(true);
			const params = filter ? { category: filter } : {};
			const response = await participantAPI.getAllOrganizers(params);
			if (response.data.success) {
				setOrganizers(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching organizers:", error);
			toast.error("Failed to fetch organizers");
		} finally {
			setLoading(false);
		}
	};

	const handleFollow = async (organizerId) => {
		try {
			const response = await participantAPI.toggleFollowOrganizer(organizerId);
			if (response.data.success) {
				toast.success(response.data.message);
				// Refresh organizers list
				fetchOrganizers();
			}
		} catch (error) {
			console.error("Error toggling follow:", error);
			toast.error("Failed to update follow status");
		}
	};

	const categories = [
		{ value: "", label: "All Categories" },
		{ value: "technical", label: "Technical" },
		{ value: "cultural", label: "Cultural" },
		{ value: "sports", label: "Sports" },
		{ value: "literary", label: "Literary" },
		{ value: "gaming", label: "Gaming" },
		{ value: "other", label: "Other" },
	];

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='mb-6'>
						<h1 className='text-3xl font-bold text-white'>
							Clubs & Organizers
						</h1>
						<p className='mt-2 text-gray-400'>
							Discover and follow clubs to stay updated with their events
						</p>
					</div>

					{/* Category Filter */}
					<div className='card mb-6'>
						<label className='block text-sm font-medium text-gray-300 mb-2'>
							Filter by Category
						</label>
						<select
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className='input-field max-w-xs'>
							{categories.map((cat) => (
								<option key={cat.value} value={cat.value}>
									{cat.label}
								</option>
							))}
						</select>
					</div>

					{/* Organizers List */}
					{loading ? (
						<div className='text-center py-12'>
							<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
							<p className='mt-4 text-gray-400'>Loading organizers...</p>
						</div>
					) : organizers.length === 0 ? (
						<div className='card text-center py-12'>
							<p className='text-gray-400 text-lg'>No organizers found</p>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{organizers.map((organizer) => (
								<div key={organizer._id} className='card'>
									<div className='flex justify-between items-start mb-3'>
										<h3 className='text-xl font-semibold text-white'>
											{organizer.name}
										</h3>
										<span className='px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded capitalize'>
											{organizer.category}
										</span>
									</div>

									<p className='text-gray-400 text-sm mb-4 line-clamp-3'>
										{organizer.description || "No description available"}
									</p>

									<div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
										<span>
											Upcoming Events: {organizer.upcomingEventsCount}
										</span>
										<span>Past Events: {organizer.pastEventsCount}</span>
									</div>

									<div className='flex gap-2'>
										<Link
											to={`/clubs/${organizer._id}`}
											className='flex-1 btn-secondary text-center py-2'>
											View Details
										</Link>
										<button
											onClick={() => handleFollow(organizer._id)}
											className='btn-primary py-2 px-4'>
											Follow
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default ClubsListing;
