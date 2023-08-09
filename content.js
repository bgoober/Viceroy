function parseAndDisplayContent() {

    // console.log for debugging
    console.log("Parsing and displaying content...");

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

    // console.log for debugging
    console.log("Content script received a message:", request);
  
    if(request.action === "startParsing") {

        // console.log for debugging
        console.log("Received 'startParsing' action.");
        
        parseAndDisplayContent();
        sendResponse({ status: "success" });
    }
});
