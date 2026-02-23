import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar, Loading, DiscussionForum } from "../../components/common";
import { organizerAPI } from "../../services/api";
import toast from "react-hot-toast";

const EventDetail = () => {
	const { eventId } = useParams();
	const navigate = useNavigate();
	const [event, setEvent] = useState(null);
	const [registrations, setRegistrations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [updating, setUpdating] = useState(false);

	useEffect(() => {
		fetchEventData();
	}, [eventId]);

	const fetchEventData = async () => {
		try {
			setLoading(true);
			const [eventRes, registrationsRes] = await Promise.all([
				organizerAPI.getEvent(eventId),
				organizerAPI.getEventRegistrations(eventId),
			]);

			setEvent(eventRes.data.data);
			setRegistrations(registrationsRes.data.data || []);
		} catch (error) {
			console.error("Error fetching event data:", error);
			toast.error("Failed to load event details");
			navigate("/organizer/dashboard");
		} finally {
			setLoading(false);
		}
	};

	const handleStatusUpdate = async (registrationId, newStatus) => {
		try {
			setUpdating(true);
			await organizerAPI.updateRegistrationStatus(
				eventId,
				registrationId,
				newStatus,
			);
			toast.success(`Registration ${newStatus}`);
			fetchEventData();
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Failed to update registration status");
		} finally {
			setUpdating(false);
		}
	};

	const handleMarkAttendance = async (registrationId) => {
		try {
			setUpdating(true);
			await organizerAPI.markAttendance(eventId, registrationId);
			toast.success("Attendance marked");
			fetchEventData();
		} catch (error) {
			console.error("Error marking attendance:", error);
			toast.error("Failed to mark attendance");
		} finally {
			setUpdating(false);
		}
	};

	const exportToCSV = () => {
		const headers = ["Ticket ID", "Name", "Email", "Status", "Registered At"];
		const csvData = filteredRegistrations.map((reg) => [
			reg.ticketId,
			reg.user?.firstName + " " + reg.user?.lastName,
			reg.user?.email,
			reg.status,
			new Date(reg.createdAt).toLocaleString(),
		]);

		const csvContent = [headers, ...csvData]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${event?.name}_registrations.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const filteredRegistrations = registrations.filter((reg) => {
		const matchesSearch =
			reg.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			reg.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			reg.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			reg.ticketId?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === "all" || reg.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const getStatusColor = (status) => {
		switch (status) {
			case "approved":
				return "text-green-400";
			case "pending":
				return "text-yellow-400";
			case "rejected":
				return "text-red-400";
			case "cancelled":
				return "text-gray-400";
			default:
				return "text-gray-400";
		}
	};

	const getEventStatusColor = (status) => {
		switch (status) {
			case "published":
				return "bg-green-500/10 text-green-400";
			case "draft":
				return "bg-yellow-500/10 text-yellow-400";
			case "cancelled":
				return "bg-red-500/10 text-red-400";
			case "completed":
				return "bg-blue-500/10 text-blue-400";
			default:
				return "bg-gray-500/10 text-gray-400";
		}
	};

	if (loading) return <Loading />;
	if (!event) return null;

	const stats = {
		totalRegistrations: registrations.length,
		approved: registrations.filter((r) => r.status === "approved").length,
		pending: registrations.filter((r) => r.status === "pending").length,
		rejected: registrations.filter((r) => r.status === "rejected").length,
		attendedCount: registrations.filter((r) => r.attended).length,
		totalRevenue: registrations
			.filter((r) => r.status === "approved")
			.reduce((sum, r) => sum + (r.totalPrice || event.registrationFee), 0),
	};

	return (
		<div className='min-h-screen bg-gray-900'>
			<Navbar />
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					{/* Header */}
					<div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
						<div>
							<div className='flex items-center gap-3'>
								<Link
									to='/organizer/dashboard'
									className='text-gray-400 hover:text-white'>
									← Back
								</Link>
								<h1 className='text-3xl font-bold text-white'>{event.name}</h1>
								<span
									className={`px-3 py-1 rounded-full text-sm ${getEventStatusColor(event.status)}`}>
									{event.status}
								</span>
							</div>
							<p className='mt-2 text-gray-400'>
								{event.eventType === "merchandise" ? "Merchandise" : "Event"} •
								{new Date(event.eventStartDate).toLocaleDateString()}
							</p>
						</div>
						<div className='mt-4 md:mt-0 flex flex-wrap gap-3'>
							<Link
								to={`/organizer/events/${eventId}/edit`}
								className='btn-secondary'>
								Edit Event
							</Link>
							<Link
								to={`/organizer/events/${eventId}/scanner`}
								className='btn-secondary'>
								QR Scanner
							</Link>
							{event.eventType === "merchandise" && (
								<Link
									to={`/organizer/events/${eventId}/payments`}
									className='btn-secondary'>
									Payment Approvals
								</Link>
							)}
							<Link
								to={`/organizer/events/${eventId}/feedback`}
								className='btn-secondary'>
								View Feedback
							</Link>
							{event.status === "draft" && (
								<button className='btn-primary'>Publish Event</button>
							)}
						</div>
					</div>

					{/* Tabs */}
					<div className='border-b border-gray-700 mb-6'>
						<nav className='flex space-x-8'>
							{["overview", "registrations", "analytics", "discussion"].map(
								(tab) => (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
											activeTab === tab
												? "border-primary-500 text-primary-400"
												: "border-transparent text-gray-400 hover:text-white"
										}`}>
										{tab}
									</button>
								),
							)}
						</nav>
					</div>

					{/* Overview Tab */}
					{activeTab === "overview" && (
						<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
							<div className='lg:col-span-2 space-y-6'>
								<div className='card'>
									<h2 className='text-xl font-semibold text-white mb-4'>
										Event Details
									</h2>
									<p className='text-gray-300 whitespace-pre-wrap'>
										{event.description}
									</p>

									<div className='grid grid-cols-2 gap-4 mt-6'>
										<div>
											<span className='text-gray-400'>Venue</span>
											<p className='text-white'>
												{event.venue || "Not specified"}
											</p>
										</div>
										<div>
											<span className='text-gray-400'>Eligibility</span>
											<p className='text-white capitalize'>
												{event.eligibility?.replace("-", " ")}
											</p>
										</div>
										<div>
											<span className='text-gray-400'>Registration Fee</span>
											<p className='text-white'>
												{event.registrationFee > 0
													? `₹${event.registrationFee}`
													: "Free"}
											</p>
										</div>
										<div>
											<span className='text-gray-400'>Registration Limit</span>
											<p className='text-white'>
												{event.registrationLimit || "Unlimited"}
											</p>
										</div>
									</div>
								</div>

								<div className='card'>
									<h2 className='text-xl font-semibold text-white mb-4'>
										Schedule
									</h2>
									<div className='space-y-3'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>
												Registration Deadline
											</span>
											<span className='text-white'>
												{new Date(event.registrationDeadline).toLocaleString()}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Event Start</span>
											<span className='text-white'>
												{new Date(event.eventStartDate).toLocaleString()}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Event End</span>
											<span className='text-white'>
												{new Date(event.eventEndDate).toLocaleString()}
											</span>
										</div>
									</div>
								</div>

								{event.customForm && event.customForm.length > 0 && (
									<div className='card'>
										<h2 className='text-xl font-semibold text-white mb-4'>
											Custom Form Fields
										</h2>
										<div className='space-y-2'>
											{event.customForm.map((field, index) => (
												<div key={index} className='flex items-center gap-2'>
													<span className='text-gray-400'>{index + 1}.</span>
													<span className='text-white'>{field.label}</span>
													<span className='text-gray-500'>
														({field.fieldType})
													</span>
													{field.required && (
														<span className='text-red-400 text-xs'>
															Required
														</span>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{event.merchandise && (
									<div className='card'>
										<h2 className='text-xl font-semibold text-white mb-4'>
											Merchandise Variants
										</h2>
										<p className='text-gray-400 mb-4'>
											{event.merchandise.itemDetails}
										</p>
										<div className='space-y-2'>
											{event.merchandise.variants?.map((variant, index) => (
												<div
													key={index}
													className='flex items-center justify-between p-3 bg-gray-800 rounded'>
													<span className='text-white'>
														{variant.name} ({variant.size} - {variant.color})
													</span>
													<div className='flex items-center gap-4'>
														<span className='text-gray-400'>
															Stock: {variant.stock}
														</span>
														{variant.priceModifier > 0 && (
															<span className='text-primary-400'>
																+₹{variant.priceModifier}
															</span>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							<div className='space-y-6'>
								<div className='card'>
									<h2 className='text-xl font-semibold text-white mb-4'>
										Quick Stats
									</h2>
									<div className='space-y-4'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Total Registrations</span>
											<span className='text-white font-bold'>
												{stats.totalRegistrations}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Approved</span>
											<span className='text-green-400 font-bold'>
												{stats.approved}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Pending</span>
											<span className='text-yellow-400 font-bold'>
												{stats.pending}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Rejected</span>
											<span className='text-red-400 font-bold'>
												{stats.rejected}
											</span>
										</div>
										<div className='border-t border-gray-700 pt-4 flex justify-between'>
											<span className='text-gray-400'>Total Revenue</span>
											<span className='text-primary-400 font-bold'>
												₹{stats.totalRevenue}
											</span>
										</div>
									</div>
								</div>

								{event.tags && event.tags.length > 0 && (
									<div className='card'>
										<h2 className='text-xl font-semibold text-white mb-4'>
											Tags
										</h2>
										<div className='flex flex-wrap gap-2'>
											{event.tags.map((tag, index) => (
												<span
													key={index}
													className='px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300'>
													{tag}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Registrations Tab */}
					{activeTab === "registrations" && (
						<div className='card'>
							<div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
								<h2 className='text-xl font-semibold text-white'>
									Registrations
								</h2>
								<div className='mt-4 md:mt-0 flex gap-3'>
									<button onClick={exportToCSV} className='btn-secondary'>
										Export CSV
									</button>
								</div>
							</div>

							{/* Filters */}
							<div className='flex flex-col md:flex-row gap-4 mb-6'>
								<input
									type='text'
									placeholder='Search by name, email, or ticket ID...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='input-field flex-1'
								/>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className='input-field md:w-48'>
									<option value='all'>All Status</option>
									<option value='pending'>Pending</option>
									<option value='approved'>Approved</option>
									<option value='rejected'>Rejected</option>
									<option value='cancelled'>Cancelled</option>
								</select>
							</div>

							{/* Registrations Table */}
							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-700'>
									<thead className='bg-gray-800'>
										<tr>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
												Ticket ID
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
												Participant
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
												Status
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
												Registered
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
												Actions
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-700'>
										{filteredRegistrations.map((reg) => (
											<tr key={reg._id} className='hover:bg-gray-800/50'>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
													{reg.ticketId}
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm text-white'>
														{reg.user?.firstName} {reg.user?.lastName}
													</div>
													<div className='text-sm text-gray-400'>
														{reg.user?.email}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<span
														className={`text-sm capitalize ${getStatusColor(reg.status)}`}>
														{reg.status}
														{reg.attended && " (Attended)"}
													</span>
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
													{new Date(reg.createdAt).toLocaleDateString()}
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm'>
													<div className='flex gap-2'>
														{reg.status === "pending" && (
															<>
																<button
																	onClick={() =>
																		handleStatusUpdate(reg._id, "approved")
																	}
																	disabled={updating}
																	className='text-green-400 hover:text-green-300'>
																	Approve
																</button>
																<button
																	onClick={() =>
																		handleStatusUpdate(reg._id, "rejected")
																	}
																	disabled={updating}
																	className='text-red-400 hover:text-red-300'>
																	Reject
																</button>
															</>
														)}
														{reg.status === "approved" && !reg.attended && (
															<button
																onClick={() => handleMarkAttendance(reg._id)}
																disabled={updating}
																className='text-blue-400 hover:text-blue-300'>
																Mark Attended
															</button>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>

								{filteredRegistrations.length === 0 && (
									<div className='text-center py-12 text-gray-500'>
										No registrations found
									</div>
								)}
							</div>
						</div>
					)}

					{/* Analytics Tab */}
					{activeTab === "analytics" && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
								<div className='card text-center'>
									<h3 className='text-gray-400 text-sm'>Total Registrations</h3>
									<p className='text-3xl font-bold text-white mt-2'>
										{stats.totalRegistrations}
									</p>
								</div>
								<div className='card text-center'>
									<h3 className='text-gray-400 text-sm'>Approval Rate</h3>
									<p className='text-3xl font-bold text-green-400 mt-2'>
										{stats.totalRegistrations > 0
											? Math.round(
													(stats.approved / stats.totalRegistrations) * 100,
												)
											: 0}
										%
									</p>
								</div>
								<div className='card text-center'>
									<h3 className='text-gray-400 text-sm'>Attendance Rate</h3>
									<p className='text-3xl font-bold text-blue-400 mt-2'>
										{stats.approved > 0
											? Math.round((stats.attendedCount / stats.approved) * 100)
											: 0}
										%
									</p>
								</div>
								<div className='card text-center'>
									<h3 className='text-gray-400 text-sm'>Total Revenue</h3>
									<p className='text-3xl font-bold text-primary-400 mt-2'>
										₹{stats.totalRevenue}
									</p>
								</div>
							</div>

							<div className='card'>
								<h2 className='text-xl font-semibold text-white mb-4'>
									Registration Status Breakdown
								</h2>
								<div className='grid grid-cols-4 gap-4'>
									<div className='bg-gray-800 rounded-lg p-4'>
										<div className='text-yellow-400 text-2xl font-bold'>
											{stats.pending}
										</div>
										<div className='text-gray-400 text-sm'>Pending</div>
									</div>
									<div className='bg-gray-800 rounded-lg p-4'>
										<div className='text-green-400 text-2xl font-bold'>
											{stats.approved}
										</div>
										<div className='text-gray-400 text-sm'>Approved</div>
									</div>
									<div className='bg-gray-800 rounded-lg p-4'>
										<div className='text-red-400 text-2xl font-bold'>
											{stats.rejected}
										</div>
										<div className='text-gray-400 text-sm'>Rejected</div>
									</div>
									<div className='bg-gray-800 rounded-lg p-4'>
										<div className='text-blue-400 text-2xl font-bold'>
											{stats.attendedCount}
										</div>
										<div className='text-gray-400 text-sm'>Attended</div>
									</div>
								</div>
							</div>

							{event.eventType === "merchandise" &&
								event.merchandise?.variants && (
									<div className='card'>
										<h2 className='text-xl font-semibold text-white mb-4'>
											Sales by Variant
										</h2>
										<div className='space-y-4'>
											{event.merchandise.variants.map((variant, index) => {
												const soldCount = registrations.filter(
													(r) =>
														r.status === "approved" &&
														r.merchandiseDetails?.variantId === variant._id,
												).length;
												const percentage =
													variant.stock > 0
														? Math.round((soldCount / variant.stock) * 100)
														: 0;

												return (
													<div key={index}>
														<div className='flex justify-between text-sm mb-1'>
															<span className='text-white'>{variant.name}</span>
															<span className='text-gray-400'>
																{soldCount} / {variant.stock} sold
															</span>
														</div>
														<div className='w-full bg-gray-700 rounded-full h-2'>
															<div
																className='bg-primary-500 h-2 rounded-full'
																style={{
																	width: `${Math.min(percentage, 100)}%`,
																}}
															/>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								)}
						</div>
					)}

					{/* Discussion Tab */}
					{activeTab === "discussion" && (
						<div>
							<DiscussionForum
								eventId={eventId}
								isRegistered={true}
								isOrganizer={true}
							/>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default EventDetail;
