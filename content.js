function parseAndDisplayContent() {
    const article = new Readability(document).parse();
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = article.content;

    // Style images or other media within the content
    const images = contentDiv.querySelectorAll('img');
    images.forEach(img => {
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.margin = "10px 0";
    });

    document.body.innerHTML = '';
    document.body.appendChild(contentDiv);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action === "startParsing") {
        parseAndDisplayContent();
        sendResponse({ status: "success" });
    }
});
