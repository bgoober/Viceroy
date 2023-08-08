const axios = require('axios');
const { JSDOM } = require('jsdom');
const Readability = require('/home/agent/readability/Readability.js');

async function getReadableContent(url) {
    // 1. Fetch the content from the provided URL
    const response = await axios.get(url);
    const htmlContent = response.data;

    // 2. Parse the content with JSDOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // 3. Process the content with Readability
    const article = new Readability(document).parse();

    return article;
}

const url = "https://www.cnn.com/2023/08/08/politics/trump-protective-order-hearing/index.html";
getReadableContent(url).then(article => {
    console.log(article.content);
}).catch(error => {
    console.error("Error processing the content:", error);
});
