document.addEventListener("DOMContentLoaded", function () {
  let button = document.getElementById("readTextButton");
  let textDisplay = document.getElementById("textDisplay");
  let downloadButton = document.getElementById("downloadTextButton");
  let speakButton = document.getElementById("speakButton");
  let extractedText = "";
  if (button) {
    button.addEventListener("click", function () {

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
          console.error("No active tab found.");
          return;
        }

        let currentTab = tabs[0];
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            function: () => {
              let textContent = document.body.innerText; 
              chrome.runtime.sendMessage({ text: textContent }); 
            },
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Script execution error:", chrome.runtime.lastError.message);
            } else {
            }
          }
        );
      });
    });
  }
  // Listen for the extracted text from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.text) {
      extractedText = message.text;
      textDisplay.innerText = "Processing summary...";

      // Send extracted text to Gemini for summarization
      sendToGemini(extractedText)
      .then((summarizedText) => {
        summary = summarizedText;
        textDisplay.innerText = summary || "Could not generate summary.";
        downloadButton.style.display="block";
        speakButton.style.display="block";
      })
      .catch((error) => {
        textDisplay.innerText = "Error getting summary.";
        console.error("Gemini API Error:", error);
      });
    }
  });

  downloadButton.addEventListener("click", function () {
    if (extractedText) {
      const { jsPDF } = window.jspdf; 
      const doc = new jsPDF();
      let filename = prompt("Enter filename:", "Summarized_Notes");
      const margin = 10; 
      const pageHeight = doc.internal.pageSize.height; 
      const wrappedText = doc.splitTextToSize(summary, 250); 
      let currentY = margin; 
      wrappedText.forEach((line, index) => {
        if (currentY + 10 > pageHeight - margin) {  
          doc.addPage(); 
          currentY = margin; 
        }
        if (line.startsWith("**") && line.endsWith("**") || line.startsWith("-**") && line.endsWith("**")) {
          doc.setFont("times", "bold");
          doc.setFontSize(14);
          line = line.replace(/\*\*/g, "");
        } else {
          doc.setFont("times", "normal");
          doc.setFontSize(10);
        }
        doc.text(line, margin, currentY); 
        currentY += 10; 
      });
      if(!filename){return};
      filename += ".pdf"; 
      doc.save(filename);
     
    } else {
      alert("No text available to download.");
    }
  });
  speakButton.addEventListener("click", function () {
    if (!summary) {
      alert("No summary available to read aloud.");
      return;
    }
    speakText(summary);
  });
 
  async function speakText(text) {
    const lang = await getLangRead();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find((voice) => voice.lang === lang);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    speechSynthesis.speak(utterance);
  }
})

// Function to send text to Gemini API for summarization
async function sendToGemini(text) {
  const apiKey = "AIzaSyCaZB7k5Gjf8TX0LoJ0gvlWfvQ_Tj0Uj-s"; // Fetch API key securely
  const summaryPref = await getSummaryPref();
  const langText = await getLangText();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `${summaryPref}` + " and you are a " + `${langText}` + " chatbot"
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Give me a detailed, digestible summary of the following text, no bold or italic if its a title make it a larger font: ${text} in ${langText}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "Error: Could not generate a summary.";
    }
  } catch (error) {
    console.error("Gemini API request failed:", error);
    return "Error connecting to Gemini API.";
  }
}


async function getSummaryPref() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('summaryPref', (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error accessing chrome.storage"));
      } else {
        resolve(result.summaryPref || "You are a helpful AI assistant"); 
      }
    });
  });
}
async function getLangText() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('languageSelectText', (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error accessing chrome.storage"));
      } else {
        resolve(result.languageSelectText || "en-US"); 
      }
    });
  });
}
function getLangRead() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('languageSelectRead', (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error accessing chrome.storage"));
      } else {
        resolve(result.languageSelectRead || "en-US"); 
      }
    });
  });
}


