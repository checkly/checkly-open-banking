const axios = require("axios")
var CryptoJS = require("crypto-js");
const crypto = require('crypto');
const { RSA } = require('./snippets/rsa.js');
const atob = require('./snippets/atob.js');
const { expect } = require('expect');

const auth_token = process.env.KOSMA_AUTH_TOKEN
const psu_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36";
const psu_ip = "10.20.30.40"

async function startSession() {
  let data = JSON.stringify({
    language: "en",
    _selected_bank: {
      bank_code: "000000",
      country_code: "GB",
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
    _aspsp_access: "prefer_psd2",
    _redirect_return_url: "http://test/auth",
    keys: {
      hsm: "--- insert hsm-key here (white label only) ---",
      aspsp_data: "--- insert aspsp_data-key here (white label only) ---",
    },
  })

  try {
    const response = await axios({
      method: 'put',
      maxBodyLength: Infinity,
      url: "https://authapi.openbanking.playground.klarna.com/xs2a/v1/sessions",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    const session_id = response.data.data.session_id
    return session_id;
  } catch (err) {
    throw new Error(err);
  }
}

async function accountDetailsFlow(session_id) {
  let data = JSON.stringify({
    "account_id": "",
    "iban": "",
    "keys": {
      "hsm": "",
      "aspsp_data": ""
    }
  });

  try {
    const response = await axios({
      method: 'put',
      maxBodyLength: Infinity,
      url: "https://api.openbanking.playground.klarna.com/xs2a/v1/sessions/" + session_id + "/flows/account-details",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    //console.log(response.data)
    const flow_id = response.data.data.flow_id
    const client_token = response.data.data.client_token
    return {
      'flow_id': flow_id,
      'client_token': client_token
    };
  } catch (err) {
    throw new Error(err);
  }
}

async function getFlowConfig(flow_id) {
  try {
    const response = await axios({
      method: 'get',
      maxBodyLength: Infinity,
      url: "https://authapi.openbanking.playground.klarna.com/branded/xs2a/v1/wizard/" + flow_id,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
    });
    const context = response.data.data.result.context
    const type = response.data.data.result.type
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

async function selectTestBank(data, flow_id) {
  try {
    const response = await axios({
      method: 'post',
      url: "https://authapi.openbanking.playground.klarna.com/branded/xs2a/v1/wizard/" + flow_id,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    //console.log(response.data)
    const form_identifier = response.data.data.result.form.form_identifier
    const xs2aform_key = response.data.data.result.key
    const context = response.data.data.result.context
    const type = response.data.data.result.type
    const xs2aform_last_step = context + ":" + type
    //console.log(xs2aform_last_step)

    return {
      'form_identifier': form_identifier,
      'xs2aform_key': xs2aform_key
    };

  } catch (err) {
    throw new Error(err);
  }
}

async function completeFlow(lastResponse, data) {
  try {
    const response = await axios({
      method: 'post',
      maxBodyLength: Infinity,
      url: lastResponse.next,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

async function getConsent(session_id) {
  let data = JSON.stringify({
    "keys": {
      "hsm": "--- insert hsm-key here (white label only) ---",
      "aspsp_data": "--- insert aspsp_data-key here (white label only) ---"
    }
  });
  try {
    const response = await axios({
      method: 'post',
      maxBodyLength: Infinity,
      url: "https://api.openbanking.playground.klarna.com/xs2a/v1/sessions/" + session_id + "/consent/get",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

async function getAccountDetails(lastResponse, accountId) {
  let data = JSON.stringify({
    "consent_token": lastResponse.consent_token,
    "account_id": accountId,

    "psu": {
      "ip_address": psu_ip,
      "user_agent": psu_ua
    },

    "keys": {
      "hsm": "",
      "aspsp_data": ""
    }
  });
  try {
    const response = await axios({
      method: 'post',
      maxBodyLength: Infinity,
      url: lastResponse.consents.account_details,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

async function getAccountBalance(lastResponse, url) {
  let data = JSON.stringify({
    "consent_token": lastResponse.consent_token,
    "account_id": lastResponse.result.account.id,

    "psu": {
      "ip_address": psu_ip,
      "user_agent": psu_ua
    },

    "keys": {
      "hsm": "",
      "aspsp_data": ""
    }
  });
  try {
    const response = await axios({
      method: 'post',
      maxBodyLength: Infinity,
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

function findModAndExp(xs2aform_key) {

  // Base64 decoding function
  function b64Decode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  // Split JWT into its three parts
  const parts = xs2aform_key.split('.');
  const header = JSON.parse(b64Decode(parts[0]));
  const payload = JSON.parse(b64Decode(parts[1]));
  const signature = parts[2];

  // console.log("header: " + header);
  // console.log("payload: " + payload.modulus);
  // console.log("sig: " + signature );

  // Extract the modulus value from the JWK object
  const modulus = payload.modulus;
  const exponent = payload.exponent;

  return {
    'modulus': modulus,
    'exponent': exponent
  };
}

function generateRandomHexString(byteLength) {
  // Create a buffer with random bytes
  const buf = crypto.randomBytes(byteLength);

  // Convert buffer to hex string
  let res = '';
  for (let i = 0; i < buf.length; i++) {
    res += ('0' + (buf[i] & 0xff).toString(16)).slice(-2);
  }
  return res;
}

function encrypt(publicKey, plainText) {

    // console.log("Log: Public Key" + publicKey );
    // console.log("Log: Plain Text" + plainText );
  if (!publicKey) {
    throw new Error('No or wrongly formatted Public Key for Encryption given');
  }
  var { modulus, exponent } = findModAndExp(publicKey)
  const iv = generateRandomHexString(16);
  const keyHex = generateRandomHexString(256 / 8);
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const encrypted = CryptoJS.AES.encrypt(plainText, key, { iv: CryptoJS.enc.Hex.parse(iv) });
  const ciphertext = encrypted.toString();

  const rsa = new RSA.key();
  rsa.setPublic(modulus, exponent);
  // Encrypt the data
  const encryptedByRsa = rsa.encrypt(keyHex);
  const encryptedKeyBytes = CryptoJS.enc.Hex.parse(encryptedByRsa);
  // Convert the encrypted key to base64
  const encryptedKey = encryptedKeyBytes.toString(CryptoJS.enc.Base64);
  return { ct: ciphertext, iv: iv, ek: encryptedKey };
}

async function sendEncryptedResponse(lastResponse, responseForm) {
  const publicKey = lastResponse.result.key
  const encryptedData = encrypt(publicKey, JSON.stringify(responseForm));
  let data = JSON.stringify(encryptedData);

  try {
    const response = await axios({
      method: 'post',
      maxBodyLength: Infinity,
      url: lastResponse.next,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Token " + auth_token,
      },
      data: data
    });
    return response.data.data
  } catch (err) {
    throw new Error(err);
  }
}

async function run() {

  const session_id = await startSession();
  //console.log(`started session with id: ${session_id}`)
  const { flow_id, client_token } = await accountDetailsFlow(session_id);
  //console.log(`started account details flow: ${flow_id}`)

  let testBankData = {
    "bank_code": "00000",
    "country_code": "DE",
    "keys": {
      "hsm": "",
      "aspsp_data": ""
    }
  };

  await selectTestBank(testBankData, flow_id);
  //
  const flowConfigResponse = await getFlowConfig(flow_id);

  const selectTransportForm = {
    "form_identifier": flowConfigResponse.result.form.form_identifier,
    "data": [
      { "key": "interface", "value": "de_testbank_bias" }
    ]
  };

  const selectTransportFormResponse = await sendEncryptedResponse(flowConfigResponse, selectTransportForm);

//   console.log("Log: " + JSON.stringify(flowConfigResponse) );
//   console.log("Log: " + JSON.stringify(selectTransportForm) );
//   console.log("Log: " + JSON.stringify(selectTransportFormResponse) );

  const userAndPasswordForm = {
    "form_identifier": selectTransportFormResponse.result.form.form_identifier,
    "data": [
      { "key": "bias.apis.forms.elements.UsernameElement", "value": "redirect" },
      { "key": "bias.apis.forms.elements.PasswordElement", "value": "123456" }
    ]
  };

  const userAndPasswordFormResponse = await sendEncryptedResponse(selectTransportFormResponse, userAndPasswordForm);
  if (userAndPasswordFormResponse.result.context === "authentication"){
    console.log("Log: " + "Test user signed in" );
    var redirect_url = userAndPasswordFormResponse.result.redirect.url + "&result=success"
    var redirect_id = userAndPasswordFormResponse.result.redirect.id
  }

  const completeAuthForm = {
    "redirect_id": redirect_id,
    "return_url": redirect_url,

    "keys": {
      "hsm": "",
      "aspsp_data": ""
    }
  }

  const completeFormResponse = await completeFlow(userAndPasswordFormResponse, completeAuthForm);
  if (completeFormResponse.result.form.elements.options === null) {
    console.error("Log: " + "No accounts found for this user?");
  }
  const accounts = completeFormResponse.result.form.elements[0].options
  const first_account = accounts[0]
  // for (let i = 0; i < accounts.length; i++) {
  //   console.log(accounts[i].label)
  // }
  const selectFirstAccountForm = {
    "form_identifier": completeFormResponse.result.form.form_identifier,
    "data": [
      { "key": "account_id", "value": first_account.value }
    ]
  };
  const accountSelectionForm = await sendEncryptedResponse(completeFormResponse, selectFirstAccountForm);
  // finish auth process
  if (accountSelectionForm.state === "FINISHED"){
    console.log("Log: " + first_account.label + " selected." );
  }
  
  const getConsentResponse = await getConsent(session_id);
  //console.log("Log: " + JSON.stringify(getConsentResponse) );
  const balances_url = getConsentResponse.consents.balances;
  const getAccountDetailsResponse = await getAccountDetails(getConsentResponse, first_account.value);
  console.log("Log: " + JSON.stringify(getAccountDetailsResponse) );
  const getAccountBalanceResponse = await getAccountBalance(getAccountDetailsResponse, balances_url);
  //console.log("Log: " + JSON.stringify(getAccountBalanceResponse) );

  const accountBalance = getAccountBalanceResponse.result.available.amount

  console.log("Log: Account Balance = €" + accountBalance );
  expect(accountBalance).toBeGreaterThanOrEqual(0);

}
run()