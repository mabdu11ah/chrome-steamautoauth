function storeDetails() {
    const username = document.querySelector('input[type=text]:nth-child(2)').value;
    const secret = document.querySelector('input[type=text]:nth-child(3)').value;
    const object = {};

    object[username] = secret;

    chrome.storage.local.set(object, () => {
        console.log('Added!');
    });
}