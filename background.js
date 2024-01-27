let readerTabs = {};

chrome.action.onClicked.addListener((tab) => {
  const payload = { tabId: tab.id, url: tab.url };
  sendPayloadToServer(payload);
  toggleReaderView(tab);
});

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
      // Send a message to the content script to show the summarized text
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          message: "showSummarizedText",
          summarizedText: data.summarizedText,
        });
      });
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "summarizedText") {
    console.log("Received summarized text:", request.payload);
    sendPayloadToServer(request.payload);
  }
});

function fetchSummarizedTextFromAgent() {
  console.log('fetchSummarizedTextFromAgent called');
  fetch('http://localhost:3001/summarized_text')
    .then(response => {
      console.log('Response from server:', response);
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error('Server response was not ok.');
      }
    })
    .then(data => {
      console.log('Received summarized text from server:', data); // Log the entire data object

      if (data.summarized_text) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              message: "showSummarizedText",
              summarizedText: data.summarized_text,
            });
          }
        );
      }
    })
    .catch(error => {
      console.log('There was a problem with the fetch operation: ', error.message);
    });
}

// Fetch the summarized text from the server every 5 seconds
setInterval(fetchSummarizedTextFromAgent, 2000);

// chrome.runtime.onMessage.addListener(function (request) {
//   if (request.message === "fetchSummary") {
//     fetchSummarizedTextFromAgent();
//   }
// });

/// READER VIEW FUNCTIONS ///

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

      // Step 2: Parse the page content
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: function () {
            const documentClone = document.cloneNode(true);
            const article = new Readability(documentClone).parse();
            return article ? article.textContent : "";
          },
        },
        (parsingResults) => {
          if (chrome.runtime.lastError) {
            console.error("Error parsing content:", chrome.runtime.lastError);
            return;
          }

          console.log("Content parsed:", parsingResults);

          let articleContent = parsingResults[0].result;

          if (articleContent) {
            // Step 3: Replace the current page content with parsed content
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: function (content) {
                  // Replace the current page content with the parsed content
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
                    sendPayloadToServer({ content: articleContent });
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

// let readerTabs = {};

// /// LOCAL SERVER PAYLOAD FUNCTIONS ///

// // You can call this function whenever you want to send a payload to the server
// // For example, you could call it when the user clicks the extension button:
// chrome.action.onClicked.addListener((tab) => {
//   const payload = { tabId: tab.id, url: tab.url }; // Replace with your actual payload
//   sendPayloadToServer(payload);
//   toggleReaderView(tab);
// });
// chrome.action.onClicked.addListener((tab) => {
//   // Step 1: Inject Readability library
//   chrome.scripting.executeScript(
//     {
//       target: { tabId: tab.id },
//       files: ["libs/readability.js"],
//     },
//     (injectionResults) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error injecting Readability:", chrome.runtime.lastError);
//         return;
//       }

//       console.log("Readability library injected:", injectionResults);

//       // Step 2: Parse content with Readability
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tab.id },
//           func: function () {
//             const documentClone = document.cloneNode(true);
//             const article = new Readability(documentClone).parse();
//             return article ? article.textContent : "";
//           },
//         },
//         ([result]) => {
//           console.log("Content parsed with Readability:", result);

//           const articleContent =
//             result.result || (result[0] && result[0].result);
//           if (articleContent) {
//             // Send the parsed article content as the payload
//             sendPayloadToServer({ content: articleContent });
//           } else {
//             console.warn("No parsed content received.");
//           }
//         }
//       );
//     }
//   );

//   toggleReaderView(tab);
// });

// let summarizedData = null;

// function sendPayloadToServer(payload) {
//   fetch("http://localhost:3001/extension", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload), // Send the payload
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       console.log("Received data:", data);
//       summarizedData = data; // Store the response data
//       createButton(); // Create the button
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });
// }

// setInterval(function () {
//   fetch("http://localhost:3001/get_summary")
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.summarized_text) {
//         summarizedData = data.summarized_text; // Store the summarized text
//         createButton(); // Create the button
//       }
//     });
// }, 7000);

// function sendMessageToShowButton() {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, {message: 'showButton', summarizedData: summarizedData});
//   });
// }

//   // Add an event listener to the button
//   button.addEventListener("click", () => {
//     showSummary();
//   });

//   // Enable the button if there is summarized data
//   if (summarizedData) {
//     button.disabled = false;
//   } else {
//     button.disabled = true;
//   }

// /// READER VIEW FUNCTIONS ///

// chrome.action.onClicked.addListener((tab) => {
//   toggleReaderView(tab);
// });

// function toggleReaderView(tab) {
//   if (readerTabs[tab.id]) {
//     // Tab is in reader mode, so reload to get original content
//     chrome.tabs.reload(tab.id);
//     delete readerTabs[tab.id]; // Remove the tab from the readerTabs object
//   } else {
//     // Switch to reader mode
//     convertToReaderView(tab);
//   }
// }

// function convertToReaderView(tab) {
//   // Step 1: Inject Readability library
//   chrome.scripting.executeScript(
//     {
//       target: { tabId: tab.id },
//       files: ["libs/readability.js"],
//     },
//     (injectionResults) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error injecting Readability:", chrome.runtime.lastError);
//         return;
//       }

//       console.log("Readability library injected:", injectionResults);

//       // Step 2: Parse content with Readability
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tab.id },
//           func: function () {
//             const documentClone = document.cloneNode(true);
//             const article = new Readability(documentClone).parse();
//             return article ? article.textContent : "";
//           },
//         },
//         ([result]) => {
//           console.log("Content parsed with Readability:", result);

//           const articleContent =
//             result.result || (result[0] && result[0].result);
//           if (articleContent) {
//             // Step 3: Replace the current page content with parsed content
//             chrome.scripting.executeScript(
//               {
//                 target: { tabId: tab.id },
//                 func: function (content) {
//                   document.open();
//                   document.write(content);
//                   document.close();
//                 },
//                 args: [articleContent],
//               },
//               (insertionResults) => {
//                 if (chrome.runtime.lastError) {
//                   console.error(
//                     "Error replacing content:",
//                     chrome.runtime.lastError
//                   );
//                   return;
//                 }

//                 // Mark tab as being in reader view
//                 readerTabs[tab.id] = true;

//                 // Step 4: Apply the reader.css styling
//                 chrome.scripting.insertCSS(
//                   {
//                     target: { tabId: tab.id },
//                     files: ["reader.css"],
//                   },
//                   (styleResults) => {
//                     if (chrome.runtime.lastError) {
//                       console.error(
//                         "Error applying CSS:",
//                         chrome.runtime.lastError
//                       );
//                     }

//                     console.log("CSS applied:", styleResults);

//                     // Send the parsed article content as the payload
//                     sendPayloadToServer({ content: articleContent });
//                   }
//                 );
//               }
//             );
//           } else {
//             console.warn("No parsed content received.");
//           }
//         }
//       );
//     }
//   );
// }

// // Fetch the summarized text from the Flask server
// function fetchSummarizedText() {
//   fetch('http://localhost:3001/get_summary')
//     .then(response => response.json())
//     .then(data => {
//       if (data.summarized_text) {
//         // Send a message to the content script with the summarized text
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//           chrome.tabs.sendMessage(tabs[0].id, {summarizedText: data.summarized_text});
//         });
//       }
//     });
// }

// // Call the function when the extension button is clicked
// chrome.action.onClicked.addListener((tab) => {
//   fetchSummarizedText();
// });

// let readerTabs = {};

// /// LOCAL SERVER PAYLOAD FUNCTIONS ///

// // You can call this function whenever you want to send a payload to the server
// // For example, you could call it when the user clicks the extension button:
// chrome.action.onClicked.addListener((tab) => {
//   const payload = { tabId: tab.id, url: tab.url }; // Replace with your actual payload
//   sendPayloadToServer(payload);
//   toggleReaderView(tab);
// });

// let summarizedData = null;

// function sendPayloadToServer(payload) {
//   fetch("http://localhost:3001/extension", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload), // Send the payload
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       console.log("Received data:", data);
//       summarizedData = data; // Store the response data
//       createButton(); // Create the button
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//     });
// }

// setInterval(function () {
//   fetch("http://localhost:3001/get_summary")
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.summarized_text) {
//         summarizedData = data.summarized_text; // Store the summarized text
//         createButton(); // Create the button
//       }
//     });
// }, 7000);

// function sendMessageToShowButton() {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, {message: 'showButton', summarizedData: summarizedData});
//   });
// }

//   // Add an event listener to the button
//   button.addEventListener("click", () => {
//     showSummary();
//   });

//   // Enable the button if there is summarized data
//   if (summarizedData) {
//     button.disabled = false;
//   } else {
//     button.disabled = true;
//   }

// function showSummary() {
//   if (summarizedData) {
//     // Create a new paragraph element
//     const p = document.createElement("p");
//     p.textContent = summarizedData; // Set the text content to the summarized data

//     // Add the paragraph to the page
//     document.body.insertBefore(p, document.body.firstChild); // Insert the paragraph above the original article

//     summarizedData = null; // Reset the summarizedData variable
//     createButton(); // Update the button
//   }
// }

// /// READER VIEW FUNCTIONS ///

// chrome.action.onClicked.addListener((tab) => {
//   toggleReaderView(tab);
// });

// function toggleReaderView(tab) {
//   if (readerTabs[tab.id]) {
//     // Tab is in reader mode, so reload to get original content
//     chrome.tabs.reload(tab.id);
//     delete readerTabs[tab.id]; // Remove the tab from the readerTabs object
//   } else {
//     // Switch to reader mode
//     convertToReaderView(tab);
//   }
// }

// function convertToReaderView(tab) {
//   // Step 1: Inject Readability library
//   chrome.scripting.executeScript(
//     {
//       target: { tabId: tab.id },
//       files: ["libs/readability.js"],
//     },
//     (injectionResults) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error injecting Readability:", chrome.runtime.lastError);
//         return;
//       }

//       console.log("Readability library injected:", injectionResults);

//       // Step 2: Parse content with Readability
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tab.id },
//           func: function () {
//             const documentClone = document.cloneNode(true);
//             const article = new Readability(documentClone).parse();
//             return article ? article.textContent : "";
//           },
//         },
//         ([result]) => {
//           console.log("Content parsed with Readability:", result);

//           const articleContent =
//             result.result || (result[0] && result[0].result);
//           if (articleContent) {
//             // Step 3: Replace the current page content with parsed content
//             chrome.scripting.executeScript(
//               {
//                 target: { tabId: tab.id },
//                 func: function (content) {
//                   document.open();
//                   document.write(content);
//                   document.close();
//                 },
//                 args: [articleContent],
//               },
//               (insertionResults) => {
//                 if (chrome.runtime.lastError) {
//                   console.error(
//                     "Error replacing content:",
//                     chrome.runtime.lastError
//                   );
//                   return;
//                 }

//                 // Mark tab as being in reader view
//                 readerTabs[tab.id] = true;

//                 // Step 4: Apply the reader.css styling
//                 chrome.scripting.insertCSS(
//                   {
//                     target: { tabId: tab.id },
//                     files: ["reader.css"],
//                   },
//                   (styleResults) => {
//                     if (chrome.runtime.lastError) {
//                       console.error(
//                         "Error applying CSS:",
//                         chrome.runtime.lastError
//                       );
//                     }

//                     console.log("CSS applied:", styleResults);

//                     // Send the parsed article content as the payload
//                     sendPayloadToServer({ content: articleContent });
//                   }
//                 );
//               }
//             );
//           } else {
//             console.warn("No parsed content received.");
//           }
//         }
//       );
//     }
//   );
// }

// // When a tab is updated or closed, ensure it's removed from the readerTabs dictionary
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && readerTabs[tabId]) {
//     delete readerTabs[tabId];
//   }
// });

// chrome.tabs.onRemoved.addListener((tabId) => {
//   if (readerTabs[tabId]) {
//     delete readerTabs[tabId];
//   }
// });

// chrome.commands.onCommand.addListener(function (command) {
//   console.log("Command received:", command);
//   if (command === "_execute_browser_action" || command === "_execute_action") {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       const currentTab = tabs[0];
//       if (currentTab) {
//         toggleReaderView(currentTab);
//       }
//     });
//   }
// });
