chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked for tab:', tab.id); // Debug line

    // Step 1: Inject Readability library
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['libs/readability.js']
    }, () => {
        console.log('Readability library injected'); // Debug line
        
        // Step 2: Parse content with Readability
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function() {
                const documentClone = document.cloneNode(true);
                const article = new Readability(documentClone).parse();
                console.log('Article parsed:', article); // Debug line inside content script
                return article ? article.content : '';
            }
        }, ([result]) => {
            if (result && result.content) {
                console.log('Parsed content received, about to replace page content'); // Debug line

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
                    console.log('Page content replaced. Injecting CSS now'); // Debug line
                    
                    // Step 4: Apply the reader.css styling
                    chrome.scripting.insertCSS({
                        target: { tabId: tab.id },
                        files: ['reader.css']
                    }, () => {
                        console.log('CSS injected successfully'); // Debug line
                    });
                });
            } else {
                console.log('No parsed content received'); // Debug line
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
