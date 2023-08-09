document.getElementById("parseButton").addEventListener("click", function() {

  // console.log for debugging
  console.log("Parse button clicked. Sending 'parsePage' action to background script.");

  chrome.runtime.sendMessage({ action: "parsePage" }, function(response) {

      // console.log for debugging
      console.log("Received response from background script:", response);
      
      if (response && response.status === "success") {
          console.log("Page parsed successfully from popup!");
      } else {
          console.error("Failed to parse the page from popup.");
      }
  });
});
