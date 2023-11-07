const { RSA } = require('./rsa.js');
const axios = require('axios');
const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const { atob } = require('./atob.js')


function findModAndExp(xs2a_form_key) {
  // Base64 decoding function
  function b64Decode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  // Split JWT into its three parts
  const parts = xs2a_form_key.split('.');
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

async function sendEncryptedResponse(lastResponse, responseForm, auth_token) {
  const publicKey = lastResponse.result.key
  const encryptedData = encrypt(publicKey, responseForm);
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
  
module.exports = { sendEncryptedResponse, generateRandomHexString, encrypt, findModAndExp }