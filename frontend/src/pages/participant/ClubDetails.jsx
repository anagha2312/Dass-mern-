import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "../../components/common";
import { participantAPI } from "../../services/api";
import toast from "react-hot-toast";

const ClubDetails = () => {
	const { id } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchOrganizerDetails();
	}, [id]);

	const fetchOrganizerDetails = async () => {
		try {
			setLoading(true);
			const response = await participantAPI.getOrganizerDetails(id);
			if (response.data.success) {
				setData(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching organizer:", error);
			toast.error("Failed to fetch organizer details");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='max-w-7xl mx-auto py-12 text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500'></div>
					<p className='mt-4 text-gray-400'>Loading...</p>
				</div>
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const { organizer, upcomingEvents, pastEvents } = data;

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Organizer Info */}
					<div className='card mb-6'>
						<div className='flex justify-between items-start mb-4'>
							<div>
								<h1 className='text-3xl font-bold text-white'>
									{organizer.name}
								</h1>
								<p className='text-primary-400 capitalize mt-2'>
									{organizer.category}
								</p>
							</div>
						</div>

						<p className='text-gray-300 mt-4 whitespace-pre-wrap'>
							{organizer.description || "No description available"}
						</p>

						{organizer.contactEmail && (
							<div className='mt-4 pt-4 border-t border-gray-700'>
								<p className='text-sm text-gray-400'>Contact</p>
								<a
									href={`mailto:${organizer.contactEmail}`}
									className='text-primary-400 hover:text-primary-300'>
									{organizer.contactEmail}
								</a>
							</div>
						)}
					</div>

					{/* Upcoming Events */}
					<div className='mb-6'>
						<h2 className='text-2xl font-bold text-white mb-4'>
							Upcoming Events ({upcomingEvents.length})
						</h2>
						{upcomingEvents.length === 0 ? (
							<div className='card text-center py-8'>
								<p className='text-gray-400'>No upcoming events</p>
							</div>
						) : (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{upcomingEvents.map((event) => (
									<Link
										key={event._id}
										to={`/events/${event._id}`}
										className='card hover:border-primary-500 transition'>
										<h3 className='text-lg font-semibold text-white mb-2'>
											{event.name}
										</h3>
										<p className='text-sm text-gray-400 mb-3 line-clamp-2'>
											{event.description}
										</p>
										<p className='text-sm text-gray-500'>
											{new Date(event.eventStartDate).toLocaleDateString()}
										</p>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Past Events */}
					<div>
						<h2 className='text-2xl font-bold text-white mb-4'>
							Past Events ({pastEvents.length})
						</h2>
						{pastEvents.length === 0 ? (
							<div className='card text-center py-8'>
								<p className='text-gray-400'>No past events</p>
							</div>
						) : (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{pastEvents.map((event) => (
									<div key={event._id} className='card opacity-75'>
										<h3 className='text-lg font-semibold text-white mb-2'>
											{event.name}
										</h3>
										<p className='text-sm text-gray-400 mb-3 line-clamp-2'>
											{event.description}
										</p>
										<p className='text-sm text-gray-500'>
											{new Date(event.eventEndDate).toLocaleDateString()}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default ClubDetails;
