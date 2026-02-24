import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { Navbar } from "../../components/common";
import toast from "react-hot-toast";

const EventFeedback = () => {
	const { eventId } = useParams();
	const [event, setEvent] = useState(null);
	const [feedbackData, setFeedbackData] = useState({
		feedbacks: [],
		stats: {},
	});
	const [loading, setLoading] = useState(true);
	const [filterRating, setFilterRating] = useState("");

	useEffect(() => {
		fetchData();
	}, [eventId, filterRating]);

	const fetchData = async () => {
		try {
			const [eventRes, feedbackRes] = await Promise.all([
				organizerAPI.getEvent(eventId),
				organizerAPI.getEventFeedback(
					eventId,
					filterRating ? { rating: filterRating } : {},
				),
			]);
			setEvent(eventRes.data.data);
			setFeedbackData(feedbackRes.data.data);
		} catch (error) {
			toast.error("Failed to load feedback");
		} finally {
			setLoading(false);
		}
	};

	const exportFeedbackCSV = () => {
		const { feedbacks } = feedbackData;
		if (!feedbacks.length) return;

		const headers = ["Rating", "Comment", "Date"];
		const rows = feedbacks.map((f) => [
			f.rating,
			`"${(f.comment || "").replace(/"/g, '""')}"`,
			new Date(f.createdAt).toLocaleString(),
		]);

		const csvContent = [headers, ...rows]
			.map((row) => row.join(","))
			.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `feedback_${event?.name || "event"}_${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Feedback exported");
	};

	const renderStars = (rating) => {
		return Array.from({ length: 5 }, (_, i) => (
			<span
				key={i}
				className={i < rating ? "text-yellow-500" : "text-gray-600"}>
				★
			</span>
		));
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='flex items-center justify-center h-96'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500'></div>
				</div>
			</div>
		);
	}

	const { feedbacks, stats } = feedbackData;

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='mb-8'>
					<Link
						to={`/organizer/events/${eventId}`}
						className='text-primary-500 hover:underline mb-2 inline-block'>
						← Back to Event
					</Link>
					<h1 className='text-3xl font-bold text-white'>{event?.name}</h1>
					<p className='text-gray-400'>Anonymous Feedback</p>
				</div>

				{/* Stats */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
					<div className='bg-gray-800 rounded-xl p-6 text-center'>
						<p className='text-4xl font-bold text-yellow-500'>
							{stats.avgRating?.toFixed(1) || "0.0"}
						</p>
						<div className='text-2xl my-2'>
							{renderStars(Math.round(stats.avgRating || 0))}
						</div>
						<p className='text-gray-400'>Average Rating</p>
					</div>
					<div className='bg-gray-800 rounded-xl p-6 text-center'>
						<p className='text-4xl font-bold text-primary-500'>
							{stats.totalFeedback || 0}
						</p>
						<p className='text-gray-400'>Total Reviews</p>
					</div>
					<div className='bg-gray-800 rounded-xl p-6'>
						<h4 className='text-white font-medium mb-3'>Rating Distribution</h4>
						{[5, 4, 3, 2, 1].map((rating) => (
							<div key={rating} className='flex items-center gap-2 mb-1'>
								<span className='text-gray-400 text-sm w-4'>{rating}</span>
								<span className='text-yellow-500'>★</span>
								<div className='flex-1 bg-gray-700 rounded-full h-2'>
									<div
										className='bg-yellow-500 h-2 rounded-full'
										style={{
											width: `${
												stats.totalFeedback
													? ((stats[`rating${rating}`] || 0) /
															stats.totalFeedback) *
														100
													: 0
											}%`,
										}}
									/>
								</div>
								<span className='text-gray-400 text-sm w-6'>
									{stats[`rating${rating}`] || 0}
								</span>
							</div>
						))}
					</div>
					<div className='bg-gray-800 rounded-xl p-6'>
						<h4 className='text-white font-medium mb-3'>Actions</h4>
						<button
							onClick={exportFeedbackCSV}
							disabled={!feedbacks.length}
							className='w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 mb-2'>
							Export as CSV
						</button>
						<select
							value={filterRating}
							onChange={(e) => setFilterRating(e.target.value)}
							className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white'>
							<option value=''>All Ratings</option>
							<option value='5'>5 Stars</option>
							<option value='4'>4 Stars</option>
							<option value='3'>3 Stars</option>
							<option value='2'>2 Stars</option>
							<option value='1'>1 Star</option>
						</select>
					</div>
				</div>

				{/* Feedback List */}
				{feedbacks.length === 0 ? (
					<div className='bg-gray-800 rounded-xl p-12 text-center'>
						<div className='text-6xl mb-4'>📝</div>
						<h3 className='text-xl font-semibold text-white mb-2'>
							No Feedback Yet
						</h3>
						<p className='text-gray-400'>
							Feedback will appear here after participants attend and review the
							event.
						</p>
					</div>
				) : (
					<div className='space-y-4'>
						{feedbacks.map((feedback) => (
							<div key={feedback._id} className='bg-gray-800 rounded-xl p-6'>
								<div className='flex items-start justify-between mb-3'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center'>
											<span className='text-gray-400'>👤</span>
										</div>
										<div>
											<p className='text-white font-medium'>Anonymous User</p>
											<p className='text-gray-500 text-sm'>
												{new Date(feedback.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className='text-xl'>{renderStars(feedback.rating)}</div>
								</div>
								{feedback.comment && (
									<p className='text-gray-300 mt-3 pl-13'>
										"{feedback.comment}"
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default EventFeedback;
