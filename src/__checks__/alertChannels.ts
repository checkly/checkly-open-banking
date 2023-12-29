import { EmailAlertChannel } from 'checkly/constructs';
import { PhoneCallAlertChannel } from 'checkly/constructs';

const sendDefaults = {
	sendFailure: true,
	sendRecovery: true,
	sendDegraded: false,
	sslExpiry: true,
	sslExpiryThreshold: 30,
};

export const emailChannel = new EmailAlertChannel('email-channel-1', {
	address: 'user@email.com', // Substitute with your email address
	...sendDefaults,
});

export const callChannel = new PhoneCallAlertChannel('call-channel-1', {
	phoneNumber: '+31061234567890', // Substitute with your phone number
});
