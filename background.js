chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background:", message);
    if (message.text) {
      // Send the extracted text to the popup
      chrome.runtime.sendMessage({ text: message.text });
    }
  });