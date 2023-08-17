let readerTabs = {};

chrome.action.onClicked.addListener((tab) => {
    toggleReaderView(tab);
});

function toggleReaderView(tab) {
    if (readerTabs[tab.id]) {
        // Tab is in reader mode, so reload to get original content
        chrome.tabs.reload(tab.id);
        delete readerTabs[tab.id];  // Remove the tab from the readerTabs object
    } else {
        // Switch to reader mode
        convertToReaderView(tab);
    }
}

function convertToReaderView(tab) {
    // Step 1: Inject Readability library
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['libs/readability.js']
    }, (injectionResults) => {
        if (chrome.runtime.lastError) {
            console.error('Error injecting Readability:', chrome.runtime.lastError);
            return;
        }

        console.log('Readability library injected:', injectionResults);

        // Step 2: Parse content with Readability
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function () {
                const documentClone = document.cloneNode(true);
                const article = new Readability(documentClone).parse();
                return article ? article.content : '';
            }
        }, ([result]) => {
            console.log('Content parsed with Readability:', result);

            const articleContent = result.result || (result[0] && result[0].result);
            if (articleContent) {
                // Step 3: Replace the current page content with parsed content
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: function (content) {
                        document.open();
                        document.write(content);
                        document.close();
                    },
                    args: [articleContent]
                }, (insertionResults) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error replacing content:', chrome.runtime.lastError);
                        return;
                    }

                    // Mark tab as being in reader view
                    readerTabs[tab.id] = true;

                    // Step 4: Apply the reader.css styling
                    chrome.scripting.insertCSS({
                        target: { tabId: tab.id },
                        files: ['reader.css']
                    }, (styleResults) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error applying CSS:', chrome.runtime.lastError);
                        }

                        console.log('CSS applied:', styleResults);
                    });
                });
            } else {
                console.warn('No parsed content received.');
            }
        });
    });
}

// When a tab is updated or closed, ensure it's removed from the readerTabs dictionary
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && readerTabs[tabId]) {
        delete readerTabs[tabId];
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (readerTabs[tabId]) {
        delete readerTabs[tabId];
    }
});

chrome.commands.onCommand.addListener(function(command) {
    console.log("Command received:", command);
    if (command === "_execute_browser_action" || command === "_execute_action") {  
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            if (currentTab) {
                toggleReaderView(currentTab);
            }
        });
    }
});



// chrome.action.onClicked.addListener((tab) => {
//     // Step 1: Inject Readability library
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['libs/readability.js']
//     }, (injectionResults) => {
//         if (chrome.runtime.lastError) {
//             console.error('Error injecting Readability:', chrome.runtime.lastError);
//             return;
//         }

//         console.log('Readability library injected:', injectionResults);

//         // Step 2: Parse content with Readability
//         chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             func: function () {
//                 const documentClone = document.cloneNode(true);
//                 const article = new Readability(documentClone).parse();
//                 return article ? article.content : '';
//             }
//         }, ([result]) => {
//             console.log('Content parsed with Readability:', result);

//             // Detailed structure log
//             console.log('Detailed structure of the result:', JSON.stringify(result, null, 2));

//             // Check if there's content and handle accordingly
//             const articleContent = result.result || (result[0] && result[0].result);
//             if (articleContent) {
//                 // Step 3: Replace the current page content with parsed content
//                 chrome.scripting.executeScript({
//                     target: { tabId: tab.id },
//                     func: function (content) {
//                         document.open();
//                         document.write(content);
//                         document.close();
//                     },
//                     args: [articleContent]
//                 }, (insertionResults) => {
//                     if (chrome.runtime.lastError) {
//                         console.error('Error replacing content:', chrome.runtime.lastError);
//                         return;
//                     }

//                     // Step 4: Apply the reader.css styling
//                     chrome.scripting.insertCSS({
//                         target: { tabId: tab.id },
//                         files: ['reader.css']
//                     }, (styleResults) => {
//                         if (chrome.runtime.lastError) {
//                             console.error('Error applying CSS:', chrome.runtime.lastError);
//                         }

//                         console.log('CSS applied:', styleResults);
//                     });
//                 });
//             } else {
//                 console.warn('No parsed content received.');
//             }
//         });
//     });
// });
