const article = document.querySelector("article");

// `document.querySelector` may return null if the selector doesn't match anything.
if (article) {
  const text = article.textContent;
  const wordMatchRegExp = /[^\s]+/g; // Regular expression
  const words = text.matchAll(wordMatchRegExp);
  // matchAll returns an iterator, convert to array to get word count
  const wordCount = [...words].length;
  const readingTime = Math.round(wordCount / 200);
  const badge = document.createElement("p");
  // Use the same styling as the publish information in an article's header
  badge.classList.add("color-secondary-text", "type--caption");
  badge.textContent = `⏱️ ${readingTime} min read`;

  // Support for API reference docs
  const heading = article.querySelector("h1");
  // Support for article docs with date
  const date = article.querySelector("time")?.parentNode;

  (date ?? heading).insertAdjacentElement("afterend", badge);
}



// function parseAndDisplayContent() {
//   // console.log for debugging
//   console.log("Parsing and displaying content...");

//   const article = new Readability(document).parse();
//   const contentDiv = document.createElement("div");
//   contentDiv.innerHTML = article.content;

//   // Style images or other media within the content
//   const images = contentDiv.querySelectorAll("img");
//   images.forEach((img) => {
//     img.style.maxWidth = "100%";
//     img.style.height = "auto";
//     img.style.margin = "10px 0";
//   });

//   document.body.innerHTML = "";
//   document.body.appendChild(contentDiv);
// }

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   // console.log for debugging
//   console.log("Content script received a message:", request);

//   if (request.action === "startParsing") {
//     // console.log for debugging
//     console.log("Received 'startParsing' action.");

//     parseAndDisplayContent();
//     sendResponse({ status: "success" });
//   }
// });
