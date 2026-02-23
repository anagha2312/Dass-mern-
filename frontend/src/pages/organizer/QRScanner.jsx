import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { Navbar } from "../../components/common";
import toast from "react-hot-toast";

const QRScanner = () => {
	const { eventId } = useParams();
	const [event, setEvent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [scanning, setScanning] = useState(false);
	const [manualTicketId, setManualTicketId] = useState("");
	const [attendanceStats, setAttendanceStats] = useState(null);
	const [recentScans, setRecentScans] = useState([]);
	const fileInputRef = useRef(null);

	useEffect(() => {
		fetchEventAndStats();
	}, [eventId]);

	const fetchEventAndStats = async () => {
		try {
			const [eventRes, statsRes] = await Promise.all([
				organizerAPI.getEvent(eventId),
				organizerAPI.getAttendanceStats(eventId),
			]);
			setEvent(eventRes.data.data);
			setAttendanceStats(statsRes.data.data);
		} catch (error) {
			toast.error("Failed to load event data");
		} finally {
			setLoading(false);
		}
	};

	const handleManualScan = async (e) => {
		e.preventDefault();
		if (!manualTicketId.trim()) {
			toast.error("Please enter a ticket ID");
			return;
		}

		setScanning(true);
		try {
			const response = await organizerAPI.scanQRCode(eventId, {
				manualTicketId: manualTicketId.trim(),
			});

			if (response.data.success) {
				toast.success("Check-in successful!");
				setRecentScans((prev) => [
					{
						...response.data.data,
						time: new Date().toLocaleTimeString(),
					},
					...prev.slice(0, 9),
				]);
				setManualTicketId("");
				fetchEventAndStats(); // Refresh stats
			}
		} catch (error) {
			if (error.response?.data?.alreadyScanned) {
				toast.error(
					`Already checked in at ${new Date(error.response.data.scannedAt).toLocaleTimeString()}`,
				);
			} else {
				toast.error(error.response?.data?.message || "Scan failed");
			}
		} finally {
			setScanning(false);
		}
	};

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// For QR code image upload, we would need a QR code reader library
		// This is a placeholder - in production, use a library like jsQR
		toast.error(
			"QR code image scanning requires camera access. Use manual entry or device camera.",
		);
		e.target.value = "";
	};

	const exportAttendanceCSV = () => {
		if (!attendanceStats?.registrations) return;

		const headers = ["Ticket ID", "Name", "Email", "Attended", "Check-in Time"];
		const rows = attendanceStats.registrations.map((reg) => [
			reg.ticketId,
			`${reg.participant?.firstName || ""} ${reg.participant?.lastName || ""}`,
			reg.participant?.email || "",
			reg.attended ? "Yes" : "No",
			reg.attendedAt ? new Date(reg.attendedAt).toLocaleString() : "-",
		]);

		const csvContent = [headers, ...rows]
			.map((row) => row.join(","))
			.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `attendance_${event?.name || "event"}_${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Attendance report exported");
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

	if (!event) {
		return (
			<div className='min-h-screen bg-gray-900'>
				<Navbar />
				<div className='container mx-auto px-4 py-8 text-center'>
					<h1 className='text-2xl text-white'>Event not found</h1>
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
					<p className='text-gray-400'>QR Scanner & Attendance Tracking</p>
				</div>

				<div className='grid lg:grid-cols-3 gap-8'>
					{/* Scanner Section */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Stats Cards */}
						<div className='grid grid-cols-3 gap-4'>
							<div className='bg-gray-800 rounded-xl p-6 text-center'>
								<p className='text-3xl font-bold text-primary-500'>
									{attendanceStats?.total || 0}
								</p>
								<p className='text-gray-400 text-sm'>Total Registered</p>
							</div>
							<div className='bg-gray-800 rounded-xl p-6 text-center'>
								<p className='text-3xl font-bold text-green-500'>
									{attendanceStats?.attended || 0}
								</p>
								<p className='text-gray-400 text-sm'>Checked In</p>
							</div>
							<div className='bg-gray-800 rounded-xl p-6 text-center'>
								<p className='text-3xl font-bold text-yellow-500'>
									{attendanceStats?.notAttended || 0}
								</p>
								<p className='text-gray-400 text-sm'>Not Yet Scanned</p>
							</div>
						</div>

						{/* Progress Bar */}
						<div className='bg-gray-800 rounded-xl p-6'>
							<div className='flex justify-between text-sm text-gray-400 mb-2'>
								<span>Attendance Rate</span>
								<span>{attendanceStats?.attendanceRate || 0}%</span>
							</div>
							<div className='w-full bg-gray-700 rounded-full h-4'>
								<div
									className='bg-primary-500 h-4 rounded-full transition-all'
									style={{ width: `${attendanceStats?.attendanceRate || 0}%` }}
								/>
							</div>
						</div>

						{/* Manual Entry */}
						<div className='bg-gray-800 rounded-xl p-6'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Manual Ticket Entry
							</h3>
							<form onSubmit={handleManualScan} className='flex gap-4'>
								<input
									type='text'
									value={manualTicketId}
									onChange={(e) =>
										setManualTicketId(e.target.value.toUpperCase())
									}
									placeholder='Enter Ticket ID (e.g., FEL123ABC)'
									className='flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
								/>
								<button
									type='submit'
									disabled={scanning}
									className='px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50'>
									{scanning ? "Scanning..." : "Check In"}
								</button>
							</form>
						</div>

						{/* QR Image Upload */}
						<div className='bg-gray-800 rounded-xl p-6'>
							<h3 className='text-lg font-semibold text-white mb-4'>
								Upload QR Code Image
							</h3>
							<input
								ref={fileInputRef}
								type='file'
								accept='image/*'
								onChange={handleFileUpload}
								className='hidden'
							/>
							<button
								onClick={() => fileInputRef.current?.click()}
								className='w-full py-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-500 transition'>
								Click to upload QR code image
							</button>
							<p className='text-gray-500 text-sm mt-2 text-center'>
								For best results, use device camera for live scanning
							</p>
						</div>

						{/* Recent Scans */}
						{recentScans.length > 0 && (
							<div className='bg-gray-800 rounded-xl p-6'>
								<h3 className='text-lg font-semibold text-white mb-4'>
									Recent Check-ins
								</h3>
								<div className='space-y-3'>
									{recentScans.map((scan, index) => (
										<div
											key={index}
											className='flex items-center justify-between bg-gray-700 rounded-lg p-3'>
											<div>
												<p className='text-white font-medium'>
													{scan.participant?.firstName}{" "}
													{scan.participant?.lastName}
												</p>
												<p className='text-gray-400 text-sm'>{scan.ticketId}</p>
											</div>
											<span className='text-green-500 text-sm'>
												{scan.time}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Attendance List */}
					<div className='bg-gray-800 rounded-xl p-6'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-semibold text-white'>
								Attendance List
							</h3>
							<button
								onClick={exportAttendanceCSV}
								className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm'>
								Export CSV
							</button>
						</div>

						<div className='space-y-2 max-h-[600px] overflow-y-auto'>
							{attendanceStats?.registrations?.map((reg) => (
								<div
									key={reg.ticketId}
									className={`flex items-center justify-between p-3 rounded-lg ${
										reg.attended ? "bg-green-900/30" : "bg-gray-700"
									}`}>
									<div>
										<p className='text-white text-sm'>
											{reg.participant?.firstName} {reg.participant?.lastName}
										</p>
										<p className='text-gray-400 text-xs'>{reg.ticketId}</p>
									</div>
									{reg.attended ? (
										<span className='text-green-500 text-xs'>
											✓ {new Date(reg.attendedAt).toLocaleTimeString()}
										</span>
									) : (
										<span className='text-yellow-500 text-xs'>Pending</span>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRScanner;
