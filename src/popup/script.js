var usernames = [];

var _secrets = {};
var _timers = {};

chrome.storage.local.get(null, (data) => {
  usernames = Object.keys(data);

  usernames.map((username) => {
    _secrets[username] = JSON.parse(data[username]).secret;
    _timers[username] = 0;
  });
  renderUsernamesUI();
});

setInterval(codeGenerator, 1000);

const button = document.getElementById('button');

button.addEventListener('click', function () {
  const username = document.getElementById('u').value;
  let password = document.getElementById('p').value;
  let secret = document.getElementById('s').value;

  if (usernames.includes(username)) return showError('You have already added that username!');
  else if (!username) return showError('Please enter a valid username!');
  else if (!password && !secret) return showError('Please enter a password or a shared secret!');

  password = password ? btoa(password) : password;
  secret = secret ? btoa(secret) : secret;

  hideError();
  emptyInputs();
  addUser(username, password, secret);
});

// listen for clicks on document
// for deletion of usernames
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete')) {
    deleteUser(event.target.id);
  }
});

// add user with details from params
function addUser(username, password, secret) {
  const object = {
    [`${username}`]: JSON.stringify({ password, secret }),
  };

  chrome.storage.local.set(object, () => {
    usernames.push(username);
    _secrets[username] = secret;
    _timers[username] = 0;
    renderUsernamesUI();
  });
}

// delete user by username
function deleteUser(username) {
  chrome.storage.local.remove([username]);

  const index = usernames.indexOf(username);
  usernames.splice(index, 1);

  delete _secrets[username];
  delete _timers[username];

  renderUsernamesUI();
}

function renderUsernamesUI() {
  resetUsernamesUI();
  hideNoAccountMessage();

  if (!usernames.length) return showNoAccountMessage();

  for (let username of usernames) {
    var label = document.createElement('li');
    label.id = `${username}-li`;
    label.innerHTML = `
      <div class="account">
        <div class="account-details">
          <h3>${username}</h3>
          <span id="${username}" class="delete" style="color: red; cursor: pointer;">Delete</span>
        </div>
      </div>
    `;

    if (_secrets[username]) {
      label.innerHTML =
        label.innerHTML +
        ` <div class="account-codes">
            <h3 class="code" id="${username}-code">Generating...</h3>
            
            <div class="code-timer-wrapper">
              <div id="${username}-code-timer" class="code-timer"></div>
            </div>
          </div>
        `;
    }

    document.getElementById('uul').appendChild(label);
  }
}

// reset usernames list
function resetUsernamesUI() {
  document.getElementById('uul').innerHTML = `
    <li style="display: none" id="nacc">There are no usernames! Add one above!</li>
  `;
}

// empty inputs
function emptyInputs() {
  document.getElementById('u').value = '';
  document.getElementById('p').value = '';
  document.getElementById('s').value = '';
}

// show error with message
function showError(msg) {
  document.getElementById('err').textContent = msg;
  document.getElementById('err').style.display = 'block';
}

function hideError() {
  document.getElementById('err').style.display = 'none';
}

// show no account message
function showNoAccountMessage() {
  document.getElementById('nacc').style.display = 'block';
}

// hide no account message
function hideNoAccountMessage() {
  document.getElementById('nacc').style.display = 'none';
}

/** Code Generator */
function codeGenerator() {
  for (let username in _secrets) {
    const codeElement = document.getElementById(`${username}-code`);
    const codeTimerElement = document.getElementById(`${username}-code-timer`);

    if (!codeElement || !codeTimerElement) continue;

    _timers[username] += 1;

    const code = generateAuthCode(atob(_secrets[username]));
    const changed = codeElement.textContent != code;
    if (changed) _timers[username] = 0;
    const width = changed ? '100%' : `${parseInt(((30 - _timers[username]) / 30) * 100)}%`;

    codeElement.textContent = code;
    codeTimerElement.style.width = width;
  }
}
