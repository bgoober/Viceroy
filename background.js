// background.js

// Function to fetch and parse content for a given URL
// This is a placeholder and might need to be implemented based on your needs
function fetchAndParseContent(url) {
    return new Promise((resolve, reject) => {
        // Logic to fetch and parse the content
        // For now, just returning the URL as a placeholder
        resolve(url);
    });
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
        // Get the current tab and send a message to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: "startParsing" }, (response) => {
                if (response && response.status === "success") {
                    console.log("Page parsed successfully!");
                } else {
                    console.error("Failed to parse the page.");
                }
            });
        });
    } else if (message.action === 'fetchContent') {
        getCachedContent(message.url).then(cachedContent => {
            if (cachedContent) {
                sendResponse({ content: cachedContent });
            } else {
                fetchAndParseContent(message.url).then(content => {
                    cacheContent(message.url, content).then(() => {
                        sendResponse({ content: content });
                    }).catch(error => {
                        console.error("Error caching content:", error);
                        sendResponse({ error: "Failed to cache content." });
                    });
                }).catch(error => {
                    console.error("Error fetching and parsing content:", error);
                    sendResponse({ error: "Failed to fetch and parse content." });
                });
            }
        }).catch(error => {
            console.error("Error retrieving cached content:", error);
            sendResponse({ error: "Failed to retrieve cached content." });
        });
        return true;  // Indicate that the response is asynchronous
    }
});

// Any other background tasks or event listeners can be added here. For example:
// - Listening for extension installation or update events
// - Managing storage for user settings or cached data
// - Handling browser actions, like button clicks or badge updates