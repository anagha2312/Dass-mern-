const {
	protect,
	authorize,
	generateToken,
	sendTokenResponse,
} = require("./auth");
const {
	handleValidationErrors,
	validateParticipantRegistration,
	validateLogin,
	validateOrganizerCreation,
	validatePasswordChange,
} = require("./validation");

module.exports = {
	protect,
	authorize,
	generateToken,
	sendTokenResponse,
	handleValidationErrors,
	validateParticipantRegistration,
	validateLogin,
	validateOrganizerCreation,
	validatePasswordChange,
};
