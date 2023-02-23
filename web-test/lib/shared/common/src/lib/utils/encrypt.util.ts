import * as ENC_HEX from 'crypto-js/enc-hex';
import * as SHA512 from 'crypto-js/sha512';

export async function encrypt(passwordPlain, pubKey) {
  const XYH = prepareInput(passwordPlain);

  const binaryDerString = window.atob(pubKey);
  const binaryDer = stringToArrayBuffer(binaryDerString);

  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    true,
    ['encrypt']
  );

  const result = await encryptDataWithPublicKey(XYH.buffer, publicKey);

  const rdata = arrayBufferToString(result);
  // result is here
  return window.btoa(rdata);
}

function prepareInput(passwordPlain) {
  const enc = new TextEncoder();

  // current time in millis
  const now = Date.now();

  // convert to array buffer
  const nowBuffer = bnToBuf(now);

  // T = current epoch millis     ( 8 bytes)
  // prepending zero byte as current time is only 6-byte in length
  const T = new Uint8Array(8);
  T.set(nowBuffer, 8 - nowBuffer.length);

  const hex = SHA512(now.toString()).toString(ENC_HEX);

  const fromHexString = hex => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  // H = SHA512(T)          (64 bytes)
  const H = fromHexString(hex);

  // R = 56 randomized bytes     (56 bytes)
  const R = new Uint8Array(Array.from({ length: 56 }, () => Math.floor(Math.random() * 56)));

  // P = user's password (normalize to 64 bytes)
  const encodedPwd = enc.encode(passwordPlain);
  const P = new Uint8Array(64);
  P.set(encodedPwd, 64 - encodedPwd.length);

  // X = P xor H
  const X = xor(P, H, 64);

  // Y = H xor (T + R)
  const Y = xor(H, concatTypedArrays(T, R), 64);

  // X + Y + H
  return concatTypedArrays(concatTypedArrays(X, Y.slice(0, 62)), H);
}

function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf),
    strLen = str.length;
  for (let i = 0; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function arrayBufferToString(str) {
  const byteArray = new Uint8Array(str);
  let byteString = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCodePoint(byteArray[i]);
  }
  return byteString;
}

function encryptDataWithPublicKey(data, key) {
  return window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    key,
    data
  );
}

// convert number to typed array
function bnToBuf(bn) {
  let hex = BigInt(bn).toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);

  let i = 0;
  let j = 0;

  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j + 2), 16);
    i += 1;
    j += 2;
  }

  return u8;
}

function concatTypedArrays(a, b) {
  const c = new a.constructor(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function xor(buf1, buf2, len) {
  const result = new Uint8Array(len);
  for (let i = 0; i < result.length; i++) {
    result[i] = buf1[i] ^ buf2[i];
  }
  return result;
}
