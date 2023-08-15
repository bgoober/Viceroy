// background.js

//self.importScripts("content.js");
//self.importScripts("popup.js");
//self.importScripts("manifest.json");
//self.importScripts("popup.html");

// Function to fetch and parse content for a given URL
// This is a placeholder and might need to be implemented based on your needs
async function fetchAndParseContent(url) {
  // Fetch the content from the provided URL
  const response = await fetch(url);
  const htmlContent = await response.text();

  // Parse the content with Readability
  const dom = new DOMParser().parseFromString(htmlContent, "text/html");
  const article = new Readability(dom).parse();

  return article.content; // Assuming we only want the content for caching and display
}

// Check if content is cached for a given URL
function getCachedContent(url) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(url, (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result[url]);
    });
  });
}

// Cache content for a given URL
function cacheContent(url, content) {
  const data = {};
  data[url] = content;
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

// Listening for messages from either the popup script or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "parsePage") {
    // console.log debugging line
    console.log(
      "Received 'parsePage' action. Sending 'startParsing' to content script.",
    );

    // Get the current tab and send a message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "startParsing" },
        (response) => {
          if (response && response.status === "success") {
            console.log("Page parsed successfully!");
            sendResponse({ status: "success" });
          } else {
            console.error("Failed to parse the page.");
            sendResponse({ status: "failed" });
          }
        },
      );
    });
  } else if (message.action === "fetchContent") {
    // console.log for debugging
    console.log("Received 'fetchContent' action.");

    getCachedContent(message.url)
      .then((cachedContent) => {
        if (cachedContent) {
          sendResponse({ content: cachedContent });
        } else {
          fetchAndParseContent(message.url)
            .then((content) => {
              cacheContent(message.url, content)
                .then(() => {
                  sendResponse({ content: content });
                })
                .catch((error) => {
                  console.error("Error caching content:", error);
                  sendResponse({ error: "Failed to cache content." });
                });
            })
            .catch((error) => {
              console.error("Error fetching and parsing content:", error);
              sendResponse({ error: "Failed to fetch and parse content." });
            });
        }
      })
      .catch((error) => {
        console.error("Error retrieving cached content:", error);
        sendResponse({ error: "Failed to retrieve cached content." });
      });
    return true; // Indicate that the response is asynchronous
  }
});

// Any other background tasks or event listeners can be added here. For example:
// - Listening for extension installation or update events
// - Managing storage for user settings or cached data
// - Handling browser actions, like button clicks or badge updates
