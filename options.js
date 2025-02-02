document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get(['summaryPref', 'languageSelectText', 'languageSelectRead'], function(data) {
        if (data.summaryPref) {
            document.getElementById('summaryPref').value = data.summaryPref;
        }
        if (data.languageSelectText) {
            document.getElementById('languageSelectText').value = data.languageSelectText;
        }
        if (data.languageSelectRead) {
            document.getElementById('languageSelectRead').value = data.languageSelectRead;
        }
    });

    // Ensure the event listener is set only after the DOM is fully loaded
    document.getElementById('save').addEventListener('click', function() {
        const summaryPref = document.getElementById('summaryPref').value;
        const textLanguage = document.getElementById('languageSelectText').value;
        const voiceLanguage = document.getElementById('languageSelectRead').value;

        // Save preferences
        chrome.storage.sync.set({
            'summaryPref': summaryPref,
            'languageSelectText': textLanguage,
            'languageSelectRead': voiceLanguage  // Correct key
        }, function() {
            alert('Settings saved!');
        });
    });
});