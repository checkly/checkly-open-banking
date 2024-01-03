import { test, expect } from '@playwright/test';
import { sendEncryptedResponse } from './snippets/functions';

const auth_token = process.env.KOSMA_AUTH_TOKEN;
const baseUrl = 'https://authapi.openbanking.playground.klarna.com';
const psu_ua =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36';
const psu_ip = '10.20.30.40';

test.describe('Klarna Open Banking', () => {
	test('XS2A API Flow', async ({ request }) => {
		const startSession = await test.step('Start Session', async () => {
			return request.put(`${baseUrl}/xs2a/v1/sessions`, {
				data: {
					language: 'en',
					_selected_bank: {
						bank_code: '000000',
						country_code: 'GB',
					},
					psu: {
						ip_address: psu_ip,
						user_agent: psu_ua,
					},
					consent_scope: {
						accounts: {},
						account_details: {},
						balances: {},
						transactions: {},
						transfer: {},
						_insights_refresh: {},
						lifetime: 30,
					},
					_aspsp_access: 'prefer_psd2',
					_redirect_return_url: 'http://test/auth',
					keys: {
						hsm: '--- xxx ---',
						aspsp_data: '--- xxx ---',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const startSessionResponse = await startSession.json();
		const session_id = startSessionResponse.data.session_id;

		/* --------------------------------------------------------------------------------------- */

		const accountDetailsFlow = await test.step('Start Account Details Flow', async () => {
			return request.put(`${baseUrl}/xs2a/v1/sessions/` + session_id + `/flows/account-details`, {
				data: {
					account_id: '',
					iban: '',
					keys: {
						hsm: '',
						aspsp_data: '',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const accountDetailsFlowResponse = await accountDetailsFlow.json();
		const flow_id = accountDetailsFlowResponse.data.flow_id;

		/* --------------------------------------------------------------------------------------- */
		const selectTestBank = await test.step('Select Test Bank (Germany)', async () => {
			return request.post(`${baseUrl}/branded/xs2a/v1/wizard/` + flow_id, {
				data: {
					bank_code: '00000',
					country_code: 'DE',
					keys: {
						hsm: '',
						aspsp_data: '',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const selectTestBankResponse = await selectTestBank.json();

		/* --------------------------------------------------------------------------------------- */

		const getFlowConfig = await test.step('Get Flow Configuration', async () => {
			return request.get(`${baseUrl}/branded/xs2a/v1/wizard/` + flow_id, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});

		const getFlowConfigResponseJSON = await getFlowConfig.json();
		const getFlowConfigResponse = getFlowConfigResponseJSON.data;

		//add some assertions here for this response

		/* --------------------------------------------------------------------------------------- */
		// Start Encrypt Responses Here

		const selectTransportForm = JSON.stringify({
			form_identifier: getFlowConfigResponse.result.form.form_identifier,
			data: [{ key: 'interface', value: 'de_testbank_bias' }],
		});

		const selectTransportFormResponse = await sendEncryptedResponse(
			getFlowConfigResponse,
			selectTransportForm,
			auth_token
		);

		const userAndPasswordForm = JSON.stringify({
			form_identifier: selectTransportFormResponse.result.form.form_identifier,
			data: [
				{ key: 'bias.apis.forms.elements.UsernameElement', value: 'redirect' },
				{ key: 'bias.apis.forms.elements.PasswordElement', value: '123456' },
			],
		});

		const userAndPasswordFormResponse = await sendEncryptedResponse(
			selectTransportFormResponse,
			userAndPasswordForm,
			auth_token
		);
		if (userAndPasswordFormResponse.result.context === 'authentication') {
			//console.log("Log: " + "Test user signed in" );
			var redirect_url = userAndPasswordFormResponse.result.redirect.url + '&result=success';
			var redirect_id = userAndPasswordFormResponse.result.redirect.id;
		}

		// End Encryption
		/* --------------------------------------------------------------------------------------- */

		const completeFlow = await test.step('Complete Flow', async () => {
			return request.post(`${baseUrl}/branded/xs2a/v1/wizard/` + flow_id, {
				data: {
					redirect_id: redirect_id,
					return_url: redirect_url,

					keys: {
						hsm: '',
						aspsp_data: '',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const completeFlowResponseJSON = await completeFlow.json();
		const completeFlowResponse = completeFlowResponseJSON.data;

		//make this an assertion with expect();
		if (completeFlowResponse.result.form.elements.options === null) {
			console.error('Log: ' + 'No accounts found for this user?');
		}

		const accounts = completeFlowResponse.result.form.elements[0].options;
		const first_account = accounts[0];

		/* --------------------------------------------------------------------------------------- */
		// Start Encrypt Responses Here
		const selectFirstAccountForm = JSON.stringify({
			form_identifier: completeFlowResponse.result.form.form_identifier,
			data: [{ key: 'account_id', value: first_account.value }],
		});

		const accountSelectionForm = await sendEncryptedResponse(completeFlowResponse, selectFirstAccountForm);

		//make this an assertion with expect();
		if (accountSelectionForm.state === 'FINISHED') {
			console.log('Log: ' + first_account.label + ' selected.');
		}
		// End Encryption
		/* --------------------------------------------------------------------------------------- */

		const getConsent = await test.step('Get Consent', async () => {
			return request.post(`https://api.openbanking.playground.klarna.com/xs2a/v1/sessions/${session_id}/consent/get`, {
				data: {
					keys: {
						hsm: '--- xxx ---',
						aspsp_data: '--- xxx ---',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const getConsentResponseJSON = await getConsent.json();
		const getConsentResponse = getConsentResponseJSON.data;
		const balances_url = getConsentResponse.consents.balances;
		const account_details_url = getConsentResponse.consents.account_details;

		/* --------------------------------------------------------------------------------------- */

		const getAccountDetails = await test.step('Get Account Details', async () => {
			return request.post(account_details_url, {
				data: {
					consent_token: getConsentResponse.consent_token,
					account_id: first_account.value,

					psu: {
						ip_address: psu_ip,
						user_agent: psu_ua,
					},

					keys: {
						hsm: '',
						aspsp_data: '',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});
		const getAccountDetailsResponseJSON = await getAccountDetails.json();
		const getAccountDetailsResponse = getAccountDetailsResponseJSON.data;

		/* --------------------------------------------------------------------------------------- */

		const getAccountBalance = await test.step('Get Account Balance', async () => {
			return request.post(balances_url, {
				data: {
					consent_token: getAccountDetailsResponse.consent_token,
					account_id: getAccountDetailsResponse.result.account.id,

					psu: {
						ip_address: psu_ip,
						user_agent: psu_ua,
					},

					keys: {
						hsm: '',
						aspsp_data: '',
					},
				},
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Token ' + auth_token,
				},
			});
		});

		const getAccountBalanceResponse = await getAccountBalance.json();
		const accountBalance = getAccountBalanceResponse.data.result.available.amount;
		//assertions to be added here on balance amount

		console.log('Log: Account Balance = €' + accountBalance);
		expect(accountBalance).toBeGreaterThanOrEqual(0);
	});
});
