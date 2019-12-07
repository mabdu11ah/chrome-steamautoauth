//modules
const Crypto = require('crypto-browserify');
require('buffer');

// elements
const loginButton = document.getElementById('SteamLogin');
const mobileCodeTextBox = document.getElementById('twofactorcode_entry');
const usernameTextBox = document.getElementById('steamAccountName');
const twoFactorDivSelector = 'div.login_modal.loginTwoFactorCodeModal';

// wait for the user to press sign in
if (loginButton) {
    loginButton.onclick = function () {
        const username = usernameTextBox.value;
    
        getUserData(username, (userData) => {
            if (userData.found) {
                enterWhenDisplayed(twoFactorDivSelector, 500, userData.code)
            }
        });
    };
}


// check if the username is selected
function getUserData(username, callback) {
    chrome.storage.local.get([username], function(data) {
        if (chrome.runtime.lastError || !data[username]) callback({ "found": false });

        const secret = data[username];
        const code = generateAuthCode(secret);

        callback({ found: true, code: code});
    });
}

// wait for two factor to display
function enterWhenDisplayed(selector, time, code) {
    twoFactorDiv = document.querySelector(selector);

    if (twoFactorDiv != null && window.getComputedStyle(twoFactorDiv).display != 'none') {
        document.execCommand('insertText', false, code);
        return;
    } else {
        setTimeout(function() {
            enterWhenDisplayed(selector, time, code);
        }, time);
    }
}

function generateAuthCode(secret) {
    secret = bufferizeSecret(secret);
    let time = Math.floor(Date.now() / 1000)

    let buffer = Buffer.allocUnsafe(8);
	buffer.writeUInt32BE(0, 0);
	buffer.writeUInt32BE(Math.floor(time / 30), 4);

	let hmac = Crypto.createHmac('sha1', secret);
	hmac = hmac.update(buffer).digest();

	let start = hmac[19] & 0x0F;
	hmac = hmac.slice(start, start + 4);

	let fullcode = hmac.readUInt32BE(0) & 0x7FFFFFFF;

	const chars = '23456789BCDFGHJKMNPQRTVWXY';

	let code = '';
	for (let i = 0; i < 5; i++) {
		code += chars.charAt(fullcode % chars.length);
		fullcode /= chars.length;
	}

	return code;
}

function bufferizeSecret(secret) {
	if (typeof secret === 'string') {
		if (secret.match(/[0-9a-f]{40}/i)) {
			return Buffer.from(secret, 'hex');
		} else {
			return Buffer.from(secret, 'base64');
		}
	}
	return secret;
}