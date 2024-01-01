let readerTabs = {};

/// LOCAL SERVER PAYLOAD FUNCTIONS ///

// You can call this function whenever you want to send a payload to the server
// For example, you could call it when the user clicks the extension button:
chrome.action.onClicked.addListener((tab) => {
  const payload = { tabId: tab.id, url: tab.url }; // Replace with your actual payload
  sendPayloadToServer(payload);
  toggleReaderView(tab);
});

let summarizedData = null;

function sendPayloadToServer(payload) {
  fetch("http://localhost:3001/extension", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      summarizedData = data; // Store the response data
      createButton(); // Create the button
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function createButton() {
  // Create a new button element
  const button = document.createElement("button");
  button.textContent = "Show Summary";

  // Add an event listener to the button
  button.addEventListener("click", () => {
    showSummary();
  });

  // Add the button to the page
  document.body.appendChild(button);
}

function showSummary() {
  if (summarizedData) {
    // Create a new paragraph element
    const p = document.createElement("p");
    p.textContent = summarizedData; // Set the text content to the summarized data

    // Add the paragraph to the page
    document.body.appendChild(p);
  }
}

/// READER VIEW FUNCTIONS ///

chrome.action.onClicked.addListener((tab) => {
  toggleReaderView(tab);
});

function toggleReaderView(tab) {
  if (readerTabs[tab.id]) {
    // Tab is in reader mode, so reload to get original content
    chrome.tabs.reload(tab.id);
    delete readerTabs[tab.id]; // Remove the tab from the readerTabs object
  } else {
    // Switch to reader mode
    convertToReaderView(tab);
  }
}

function convertToReaderView(tab) {
  // Step 1: Inject Readability library
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["libs/readability.js"],
    },
    (injectionResults) => {
      if (chrome.runtime.lastError) {
        console.error("Error injecting Readability:", chrome.runtime.lastError);
        return;
      }

      console.log("Readability library injected:", injectionResults);

      // Step 2: Parse content with Readability
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: function () {
            const documentClone = document.cloneNode(true);
            const article = new Readability(documentClone).parse();
            return article ? article.content : "";
          },
        },
        ([result]) => {
          console.log("Content parsed with Readability:", result);

          const articleContent =
            result.result || (result[0] && result[0].result);
          if (articleContent) {
            // Step 3: Replace the current page content with parsed content
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: function (content) {
                  document.open();
                  document.write(content);
                  document.close();
                },
                args: [articleContent],
              },
              (insertionResults) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error replacing content:",
                    chrome.runtime.lastError
                  );
                  return;
                }

                // Mark tab as being in reader view
                readerTabs[tab.id] = true;

                // Step 4: Apply the reader.css styling
                chrome.scripting.insertCSS(
                  {
                    target: { tabId: tab.id },
                    files: ["reader.css"],
                  },
                  (styleResults) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "Error applying CSS:",
                        chrome.runtime.lastError
                      );
                    }

                    console.log("CSS applied:", styleResults);

                    // Send the parsed article content as the payload
                    const payload = {
                      tabId: tab.id,
                      url: tab.url,
                      content: articleContent,
                    };
                    sendPayloadToServer(payload);
                  }
                );
              }
            );
          } else {
            console.warn("No parsed content received.");
          }
        }
      );
    }
  );
}

// When a tab is updated or closed, ensure it's removed from the readerTabs dictionary
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && readerTabs[tabId]) {
    delete readerTabs[tabId];
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (readerTabs[tabId]) {
    delete readerTabs[tabId];
  }
});

chrome.commands.onCommand.addListener(function (command) {
  console.log("Command received:", command);
  if (command === "_execute_browser_action" || command === "_execute_action") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab) {
        toggleReaderView(currentTab);
      }
    });
  }
});
