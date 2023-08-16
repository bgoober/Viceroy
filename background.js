chrome.action.onClicked.addListener((tab) => {
    // Step 1: Inject Readability library
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['libs/readability.js']
    }, () => {
        // Step 2: Parse content with Readability
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function() {
                const documentClone = document.cloneNode(true);
                const article = new Readability(documentClone).parse();
                return article ? article.content : '';
            }
        }, ([result]) => {
            if (result && result.content) {
                // Step 3: Replace the current page content with parsed content
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: function(content) {
                        document.open();
                        document.write(content);
                        document.close();
                    },
                    args: [result.content]
                }, () => {
                    // Step 4: Apply the reader.css styling
                    chrome.scripting.insertCSS({
                        target: { tabId: tab.id },
                        files: ['styles/reader.css']
                    });
                });
            }
        });
    });
});




// chrome.action.onClicked.addListener((tab) => {
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['libs/readability.js']
//     }, () => {
//         chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             code: `
//                 const documentClone = document.cloneNode(true);
//                 const article = new Readability(documentClone).parse();
//                 article.content;
//             `
//         }, ([result]) => {
//             const readerWin = window.open('reader.html', 'reader_view', 'width=800,height=600');
//             readerWin.onload = function () {
//                 readerWin.document.body.innerHTML = result.content;
//             };
//         });
//     });
// });
