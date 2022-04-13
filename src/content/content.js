// timeout
var timeout = null;

// elements
const loginButton = document.getElementById('SteamLogin') || document.getElementById('login_btn_signin');
const usernameTextBox = document.getElementById('input_username') || document.getElementById('steamAccountName');
const passwordTextBox = document.getElementById('input_password') || document.getElementById('steamPassword');
const twoFactorDivSelector = 'div.login_modal.loginTwoFactorCodeModal';
const loginClick = document.querySelector('#login_btn_signin > button') || document.querySelector('#imageLogin');
const submitBtn = document.querySelector('#login_twofactorauth_buttonset_entercode > div.auth_button.leftbtn');

usernameTextBox.addEventListener('keyup', function () {
  if (timeout) clearTimeout(timeout);

  getUserData(usernameTextBox.value, (userData) => {
    if (userData.found && userData.password) {
      passwordTextBox.value = userData.password;

      // after 750 ms click login and enter code
      // if key pressed before 750 ms then clear timeout
      timeout = setTimeout(() => {
        loginClick.click();
      }, 750);
    }
  });
});

// wait for the user to press sign in
if (loginButton) {
  loginButton.onclick = function () {
    const username = usernameTextBox.value;

    getUserData(username, (userData) => {
      if (userData.found && userData.code) {
        enterWhenDisplayed(twoFactorDivSelector, 500, userData.code);
      }
    });
  };
}

// check if the username is selected
function getUserData(username, callback) {
  chrome.storage.local.get([username], function (data) {
    if (chrome.runtime.lastError || !data[username] || data[username] === null || !Object.values(data[username]).length) {
      callback({ found: false });
    }

    try {
      data = JSON.parse(data[username]);
    } catch {}

    try {
      if (!data.secret) throw new Error();
      var secret = atob(data.secret);
      var code = generateAuthCode(secret);
    } catch {
      var code = '';
    }

    try {
      var password = atob(data.password);
    } catch {
      var password = '';
    }

    callback({ found: true, code, password });
  });
}

// wait for two factor to display
function enterWhenDisplayed(selector, time, code) {
  twoFactorDiv = document.querySelector(selector);

  if (twoFactorDiv != null && window.getComputedStyle(twoFactorDiv).display != 'none') {
    document.execCommand('insertText', false, code);
    submitBtn.click();
  } else {
    setTimeout(function () {
      enterWhenDisplayed(selector, time, code);
    }, time);
  }
}
