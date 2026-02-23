import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { Navbar } from "../../components/common";
import toast from "react-hot-toast";

const PaymentApproval = () => {
	const { eventId } = useParams();
	const [event, setEvent] = useState(null);
	const [pendingPayments, setPendingPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(null);
	const [selectedPayment, setSelectedPayment] = useState(null);
	const [comment, setComment] = useState("");

	useEffect(() => {
		fetchData();
	}, [eventId]);

	const fetchData = async () => {
		try {
			const [eventRes, paymentsRes] = await Promise.all([
				organizerAPI.getEvent(eventId),
				organizerAPI.getPendingPayments(eventId),
			]);
			setEvent(eventRes.data.data);
			setPendingPayments(paymentsRes.data.data);
		} catch (error) {
			toast.error("Failed to load data");
		} finally {
			setLoading(false);
		}
	};

	const handleApproval = async (registrationId, action) => {
		setProcessing(registrationId);
		try {
			await organizerAPI.handlePaymentApproval(eventId, registrationId, {
				action,
				comment: comment || undefined,
			});

			toast.success(
				action === "approve"
					? "Payment approved! Ticket generated and emailed."
					: "Payment rejected.",
			);

			// Remove from pending list
			setPendingPayments((prev) =>
				prev.filter((p) => p._id !== registrationId),
			);
			setSelectedPayment(null);
			setComment("");
		} catch (error) {
			toast.error(error.response?.data?.message || "Action failed");
		} finally {
			setProcessing(null);
		}
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

	if (!event || event.eventType !== "merchandise") {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='container mx-auto px-4 py-8 text-center'>
					<h1 className='text-2xl text-white'>
						{event ? "Not a merchandise event" : "Event not found"}
					</h1>
					<Link
						to='/organizer/dashboard'
						className='text-primary-500 hover:underline mt-4 inline-block'>
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

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
					<h1 className='text-3xl font-bold text-white'>{event.name}</h1>
					<p className='text-gray-400'>Payment Approval Workflow</p>
				</div>

				{/* Stats */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
					<div className='bg-gray-800 rounded-xl p-6'>
						<p className='text-3xl font-bold text-yellow-500'>
							{pendingPayments.length}
						</p>
						<p className='text-gray-400'>Pending Approvals</p>
					</div>
					<div className='bg-gray-800 rounded-xl p-6'>
						<p className='text-3xl font-bold text-primary-500'>
							{event.currentRegistrations || 0}
						</p>
						<p className='text-gray-400'>Confirmed Orders</p>
					</div>
					<div className='bg-gray-800 rounded-xl p-6'>
						<p className='text-3xl font-bold text-green-500'>
							{event.merchandise?.totalStock || 0}
						</p>
						<p className='text-gray-400'>Stock Remaining</p>
					</div>
				</div>

				{/* Pending Payments List */}
				{pendingPayments.length === 0 ? (
					<div className='bg-gray-800 rounded-xl p-12 text-center'>
						<div className='text-6xl mb-4'>✅</div>
						<h3 className='text-xl font-semibold text-white mb-2'>
							No Pending Payments
						</h3>
						<p className='text-gray-400'>
							All payment proofs have been reviewed!
						</p>
					</div>
				) : (
					<div className='grid gap-4'>
						{pendingPayments.map((payment) => (
							<div key={payment._id} className='bg-gray-800 rounded-xl p-6'>
								<div className='flex flex-col lg:flex-row gap-6'>
									{/* Participant Info */}
									<div className='flex-1'>
										<div className='flex items-start justify-between mb-4'>
											<div>
												<h3 className='text-lg font-semibold text-white'>
													{payment.participant?.firstName}{" "}
													{payment.participant?.lastName}
												</h3>
												<p className='text-gray-400 text-sm'>
													{payment.participant?.email}
												</p>
												<p className='text-gray-500 text-sm'>
													{payment.participant?.contactNumber}
												</p>
											</div>
											<span className='px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm'>
												Pending Approval
											</span>
										</div>

										{/* Order Details */}
										<div className='bg-gray-700 rounded-lg p-4 mb-4'>
											<h4 className='text-white font-medium mb-2'>
												Order Details
											</h4>
											<div className='grid grid-cols-2 gap-2 text-sm'>
												<div>
													<span className='text-gray-400'>Ticket ID:</span>
													<span className='text-white ml-2'>
														{payment.ticketId}
													</span>
												</div>
												<div>
													<span className='text-gray-400'>Amount:</span>
													<span className='text-white ml-2'>
														₹{payment.paymentAmount || 0}
													</span>
												</div>
												{payment.merchandiseDetails && (
													<>
														<div>
															<span className='text-gray-400'>Variant:</span>
															<span className='text-white ml-2'>
																{payment.merchandiseDetails.variantName}
															</span>
														</div>
														<div>
															<span className='text-gray-400'>Quantity:</span>
															<span className='text-white ml-2'>
																{payment.merchandiseDetails.quantity}
															</span>
														</div>
													</>
												)}
											</div>
										</div>

										{/* Payment Proof */}
										{payment.paymentProof && (
											<div className='mb-4'>
												<h4 className='text-white font-medium mb-2'>
													Payment Proof
												</h4>
												{payment.paymentProof.imageUrl && (
													<img
														src={payment.paymentProof.imageUrl}
														alt='Payment Proof'
														className='w-full max-w-md rounded-lg border border-gray-600 cursor-pointer hover:opacity-80'
														onClick={() => setSelectedPayment(payment)}
													/>
												)}
												{payment.paymentProof.note && (
													<p className='text-gray-400 text-sm mt-2'>
														Note: {payment.paymentProof.note}
													</p>
												)}
												<p className='text-gray-500 text-xs mt-1'>
													Uploaded:{" "}
													{new Date(
														payment.paymentProof.uploadedAt,
													).toLocaleString()}
												</p>
											</div>
										)}
									</div>

									{/* Actions */}
									<div className='lg:w-64 space-y-3'>
										<textarea
											placeholder='Add comment (optional)'
											value={
												selectedPayment?._id === payment._id ? comment : ""
											}
											onChange={(e) => {
												setSelectedPayment(payment);
												setComment(e.target.value);
											}}
											className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-primary-500'
											rows={2}
										/>
										<button
											onClick={() => handleApproval(payment._id, "approve")}
											disabled={processing === payment._id}
											className='w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium'>
											{processing === payment._id
												? "Processing..."
												: "✓ Approve Payment"}
										</button>
										<button
											onClick={() => handleApproval(payment._id, "reject")}
											disabled={processing === payment._id}
											className='w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium'>
											{processing === payment._id
												? "Processing..."
												: "✕ Reject Payment"}
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Image Modal */}
				{selectedPayment?.paymentProof?.imageUrl && (
					<div
						className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'
						onClick={() => setSelectedPayment(null)}>
						<div className='max-w-4xl max-h-[90vh] overflow-auto'>
							<img
								src={selectedPayment.paymentProof.imageUrl}
								alt='Payment Proof Full'
								className='w-full h-auto rounded-lg'
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PaymentApproval;
