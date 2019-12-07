chrome.storage.local.get(null, (data) => {
    for (var i in Object.keys(data)) {
        addUsername(Object.keys(data)[i])
    }

    if (!Object.keys(data).length) {
        addUsername('There are no usernames! Add one above!')
    }
})

const button = document.getElementById('button')

button.addEventListener('click', function () {
    const username = document.getElementById('username').value;
    const secret = document.getElementById('secret').value;
    const object = {};

    object[username] = secret;

    chrome.storage.local.set(object, () => {
        addUsername(username);
    });
})

function addUsername(username) {
    var label = document.createElement('li');
    var text = document.createTextNode(username);         
    label.appendChild(text);                              
    document.getElementById('usernames').appendChild(label); 
}