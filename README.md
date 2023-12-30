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