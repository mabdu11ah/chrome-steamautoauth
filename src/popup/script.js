const button = document.getElementById('button')

button.addEventListener('click', function () {
    const username = document.getElementById('username').value;
    const secret = document.getElementById('secret').value;
    const object = {};

    object[username] = secret;

    chrome.storage.local.set(object, () => {
        var label = document.createElement('li');
        var text = document.createTextNode(username);         
        label.appendChild(text);                              
        document.getElementById('usernames').appendChild(label); 
    });
})
