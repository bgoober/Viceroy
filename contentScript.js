chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === 'showSummarizedText') {
      // Check if the summarizedTextContainer element already exists
      let summarizedTextContainer = document.getElementById('summarizedTextContainer');
      if (!summarizedTextContainer) {
        // If it doesn't exist, create it
        summarizedTextContainer = document.createElement('div');
        summarizedTextContainer.id = 'summarizedTextContainer';
        summarizedTextContainer.style.width = '50%';
        summarizedTextContainer.style.float = 'right';
  
        // Add the element to the body
        document.body.appendChild(summarizedTextContainer);
      }
  
      // Update the element's text content with the summarized text
      summarizedTextContainer.textContent = request.summarizedText;
    }
  });