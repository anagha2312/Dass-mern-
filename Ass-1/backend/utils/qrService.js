const QRCode = require("qrcode");

/**
 * Generate QR code for ticket
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<String>} Base64 encoded QR code image
 */
const generateTicketQR = async (data) => {
	try {
		// Create QR code data string
		const qrData = JSON.stringify({
			ticketId: data.ticketId,
			eventId: data.eventId,
			participantId: data.participantId,
			eventName: data.eventName,
			participantName: data.participantName,
			timestamp: new Date().toISOString(),
		});

		// Generate QR code as base64 data URL
		const qrCodeDataURL = await QRCode.toDataURL(qrData, {
			errorCorrectionLevel: "H",
			type: "image/png",
			quality: 0.92,
			margin: 1,
			width: 300,
			color: {
				dark: "#1f2937",
				light: "#ffffff",
			},
		});

		return qrCodeDataURL;
	} catch (error) {
		console.error("Error generating QR code:", error);
		throw new Error("Failed to generate QR code");
	}
};

/**
 * Verify QR code data
 * @param {String} qrData - QR code data string
 * @returns {Object} Decoded QR data
 */
const verifyTicketQR = (qrData) => {
	try {
		const data = JSON.parse(qrData);

		// Validate required fields
		if (
			!data.ticketId ||
			!data.eventId ||
			!data.participantId ||
			!data.eventName ||
			!data.participantName
		) {
			throw new Error("Invalid QR code data");
		}

		return data;
	} catch (error) {
		console.error("Error verifying QR code:", error);
		throw new Error("Invalid QR code");
	}
};

module.exports = {
	generateTicketQR,
	verifyTicketQR,
};
