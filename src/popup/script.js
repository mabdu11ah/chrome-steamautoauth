var usernames = [];

chrome.storage.local.get(null, (data) => {
  usernames = Object.keys(data);
  renderUsernamesUI();
});

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
    renderUsernamesUI();
  });
}

// delete user by username
function deleteUser(username) {
  chrome.storage.local.remove([username]);

  const index = usernames.indexOf(username);
  usernames.splice(index, 1);

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
      <div>
        ${username}
        <span id="${username}" class="delete" style="color: red; cursor: pointer;">Delete</span>
      </div>
    `;

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
