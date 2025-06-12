/**
 * This file is self sufficient and modular.
 * The `generateAuthCode` function can generate a steam mobile code given a shared secret.
 * This is useful if you are trying to generate auth codes on the browser, whilst
 * being as lightweight as possible.
 */

function sha1(msg: string, raw?: boolean) {
  function rotate_left(n: number, s: number) {
    var t4 = (n << s) | (n >>> (32 - s));
    return t4;
  }

  function cvt_hex(val: number, raw?: boolean) {
    var str = "";
    var i;
    var v;

    for (i = 7; i >= 0; i--) {
      v = (val >>> (i * 4)) & 0x0f;
      str += raw ? String.fromCharCode(v) : v.toString(16);
    }
    return str;
  }

  var blockstart;
  var i, j;
  var W = new Array(80);
  var H0 = 0x67452301;
  var H1 = 0xefcdab89;
  var H2 = 0x98badcfe;
  var H3 = 0x10325476;
  var H4 = 0xc3d2e1f0;
  var A, B, C, D, E;
  var result, rawResult;

  var msg_len = msg.length;

  var word_array = [];
  for (i = 0; i < msg_len - 3; i += 4) {
    j =
      (msg.charCodeAt(i) << 24) |
      (msg.charCodeAt(i + 1) << 16) |
      (msg.charCodeAt(i + 2) << 8) |
      msg.charCodeAt(i + 3);
    word_array.push(j);
  }

  switch (msg_len % 4) {
    case 0:
      i = 0x080000000;
      break;
    case 1:
      i = (msg.charCodeAt(msg_len - 1) << 24) | 0x0800000;
      break;

    case 2:
      i =
        (msg.charCodeAt(msg_len - 2) << 24) |
        (msg.charCodeAt(msg_len - 1) << 16) |
        0x08000;
      break;

    case 3:
      i =
        (msg.charCodeAt(msg_len - 3) << 24) |
        (msg.charCodeAt(msg_len - 2) << 16) |
        (msg.charCodeAt(msg_len - 1) << 8) |
        0x80;
      break;
  }

  word_array.push(i);

  while (word_array.length % 16 != 14) word_array.push(0);

  word_array.push(msg_len >>> 29);
  word_array.push((msg_len << 3) & 0x0ffffffff);

  for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
    for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
    for (i = 16; i <= 79; i++)
      W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

    A = H0;
    B = H1;
    C = H2;
    D = H3;
    E = H4;

    let temp;

    for (i = 0; i <= 19; i++) {
      temp =
        (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5a827999) &
        0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 20; i <= 39; i++) {
      temp =
        (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ed9eba1) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 40; i <= 59; i++) {
      temp =
        (rotate_left(A, 5) +
          ((B & C) | (B & D) | (C & D)) +
          E +
          W[i] +
          0x8f1bbcdc) &
        0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    for (i = 60; i <= 79; i++) {
      temp =
        (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xca62c1d6) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B, 30);
      B = A;
      A = temp;
    }

    H0 = (H0 + A) & 0x0ffffffff;
    H1 = (H1 + B) & 0x0ffffffff;
    H2 = (H2 + C) & 0x0ffffffff;
    H3 = (H3 + D) & 0x0ffffffff;
    H4 = (H4 + E) & 0x0ffffffff;
  }

  result = (
    cvt_hex(H0) +
    cvt_hex(H1) +
    cvt_hex(H2) +
    cvt_hex(H3) +
    cvt_hex(H4)
  ).toLowerCase();

  if (!raw) {
    return result;
  }

  rawResult = "";
  while (result.length) {
    rawResult += String.fromCharCode(parseInt(result.substr(0, 2), 16));
    result = result.substr(2);
  }
  return rawResult;
}

function hmacSha1(msg: string, key: string) {
  var oKeyPad, iKeyPad, iPadRes, bytes, i, len;
  if (key.length > 64) {
    key = sha1(key, true);
  }

  bytes = [];
  len = key.length;
  for (i = 0; i < 64; ++i) {
    bytes[i] = len > i ? key.charCodeAt(i) : 0x00;
  }

  oKeyPad = "";
  iKeyPad = "";

  for (i = 0; i < 64; ++i) {
    oKeyPad += String.fromCharCode(bytes[i] ^ 0x5c);
    iKeyPad += String.fromCharCode(bytes[i] ^ 0x36);
  }

  iPadRes = sha1(iKeyPad + msg, true);

  return sha1(oKeyPad + iPadRes);
}

function hexToAscii(hex: string) {
  var str = "";

  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }

  return str;
}

function base64ToHex(b64: string) {
  const raw = atob(b64);
  let result = "";

  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : "0" + hex;
  }

  return result;
}

export function generateAuthCode(shared: string, timeOffset = 0) {
  const secret = base64ToHex(shared);
  const time = Math.floor(Date.now() / 1000) + timeOffset;

  let buffer = "00000000";
  let timeRadixed = Math.floor(time / 30).toString(16);

  while (timeRadixed.length < 8) {
    timeRadixed = "0" + timeRadixed;
  }

  buffer += timeRadixed;

  const asciiBuffer = hexToAscii(buffer);
  const asciiSecret = hexToAscii(secret);
  let hmac = hmacSha1(asciiBuffer, asciiSecret);

  const hexStart = parseInt(hmac.substring(hmac.length - 2, hmac.length), 16);
  let start = hexStart & 0x0f;

  // @ts-ignore
  hmac = hmac
    .match(/.{1,2}/g)
    .slice(start, start + 4)
    .join("");

  let fullCode = parseInt(hmac, 16) & 0x7fffffff;
  const chars = "23456789BCDFGHJKMNPQRTVWXY";

  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(fullCode % chars.length);
    fullCode /= chars.length;
  }

  return code;
}
