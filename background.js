chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['libs/readability.js']
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            code: `
                const documentClone = document.cloneNode(true);
                const article = new Readability(documentClone).parse();
                article.content;
            `
        }, ([result]) => {
            const readerWin = window.open('reader.html', 'reader_view', 'width=800,height=600');
            readerWin.onload = function () {
                readerWin.document.body.innerHTML = result.content;
            };
        });
    });
});
