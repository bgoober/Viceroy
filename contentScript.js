chrome.runtime.onMessage.addListener(function (request) {
  if (request.message === "showSummarizedText") {
    console.log("showSummarizedText message received");
    // Check if the summarizedTextContainer element already exists
    let summarizedTextContainer = document.getElementById(
      "summarizedTextContainer"
    );
    if (!summarizedTextContainer) {
      // If it doesn't exist, create it
      summarizedTextContainer = document.createElement("div");
      summarizedTextContainer.id = "summarizedTextContainer";
      summarizedTextContainer.style.width = "100%"; // Change width to 100%
      summarizedTextContainer.style.float = "none"; // Remove float
      summarizedTextContainer.style.borderTop = "1px solid #000"; // Add a horizontal divider

      // Add the element to the body
      document.body.appendChild(summarizedTextContainer);
    }

    // Update the element's text content with the summarized text
    summarizedTextContainer.textContent = request.summarizedText;
  }
});
