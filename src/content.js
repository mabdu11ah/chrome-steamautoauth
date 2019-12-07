//modules

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
        const code = SteamTotp.generateAuthCode(secret);

        callback({ found: true, code: code});
    });
}

// check for element to display
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