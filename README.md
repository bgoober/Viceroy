# Viceroy

An artificially intelligent reader view for detecting and categorizing bias in an article or web page.

AI Agents are from Fetch.ai's uAgents repository -- https://github.com/fetchai/uAgents

---

We will likely need a model, or models, capable of at least these three Tasks:

Summarization:
https://huggingface.co/tasks/summarization

Text Generation:
https://huggingface.co/tasks/text-generation

Text Classification
https://huggingface.co/tasks/text-classification


---

In future versions:

In Version 1, beyond the MVP, the Browser Extension and the User Agent would be combined into a single entity; in that the Browser Extension and User Agent no longer need to act as separate entities, but are one in the same. The readability.js library's abilities would be encompassed by the User Agent, and the agent would be capable of performing all of the parsing functions that the extension was performing previously.

The HuggingFace Agent would also be a remotely hosted agent that itself would be hosting its own Large Language model, properly trained to summarize the content of an article, as well as perform a political bias analysis. This agent would now no longer be hosted by HuggingFace, but rather by our own agent, complete with its own Large Language Model.

The User Agent/Browser Extension, would be funded by the user's wallet, and pay for each Summary and Bias analysis that is requested.

The remote LLM Agent would store each past request in its own expansive memory, and further requests of the same content would not require payment, or, payment would reimburse the original requester with further requests being made by subsequent users. Over time, a source of truth may be formed out of the corpus of articles parsed from all of the outlets reporting on the same news or topic. Clustering analysis can help analyze articles of the same topic or subject.


---

Here's how the process works:

1. When the extension icon is clicked, the chrome.action.onClicked.addListener event is triggered. This event calls the toggleReaderView function with the current tab as an argument.

2. The toggleReaderView function checks if the current tab is in reader mode. If it's not, it calls the convertToReaderView function.

3. The convertToReaderView function injects the Readability library into the current tab, parses the content of the webpage using Readability, replaces the current page content with the parsed content, applies the reader.css styling, and sends the parsed content as a payload to the user agent.

4. The payload is sent to the user agent by calling the sendPayloadToServer function with the payload as an argument. This function sends a POST request to the user agent's server with the payload.

5. The user agent's server receives the POST request and the payload is stored in the agent's shared state.

So, when the extension icon is clicked, the parsed content of the website is sent as a payload to the user agent.

---

Initially, Viceroy summarizes articles, and provides political and philosophical bias detection and reporting. 

Overtime, Viceroy reads and remembers the information it takes in. It evolves the ability to reason on a larger scale with regards to the objective reality, or as objectively as possible with the given inputs.

A map of the sources of news begins to take shape. CNN, Fox, RT, Infowars, SOTT, Reuters, you name it... any and all houses and their subjective bubbles begin to be known.

Reality is double checked back in time, then compared to the snapshot of today, and the events in between.

A model of the world in real-time, with clear, open source algorithms at its heart.

The fetch blockchain, or its network of validators and maintainers, as well as a perhaps yet unseen network of permanent run time and storage will constitute the digital backbone of the brain we hope to achieve.



Releases:

Egg:
- Day 1
    Article summary
- Day 2
    Bias detection
- Day 3
    Bias report

Caterpillar:



Chrysalis


Butterfly