import os, requests, asyncio
from uagents import Agent, Context, Protocol
from messages.t5_base import SummarizationRequest, SummarizationResponse, Error
from uagents.setup import fund_agent_if_low
from bs4 import BeautifulSoup
from flask import Flask, ctx, g, request, jsonify
from threading import Thread
from flask_cors import CORS


# THIS IS THE USER'S AGENT -- AGENT NUMBER 1 IN THE ARCHITECTURE

# Replace this input with the text you want to summarize
INPUT_TEXT = ""


# Get the T5_BASE_AGENT_ADDRESS from the environment variables
T5_BASE_AGENT_ADDRESS = os.getenv(
    "T5_BASE_AGENT_ADDRESS", "T5_BASE_AGENT_ADDRESS")

# If the T5_BASE_AGENT_ADDRESS is not set, raise an exception
if T5_BASE_AGENT_ADDRESS == "T5_BASE_AGENT_ADDRESS":
    raise Exception(
        "You need to provide an T5_BASE_AGENT_ADDRESS, by exporting env, check README file")

# Define user agent with specified parameters
user = Agent(
    name="t5_base_user",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"],
)

# Check and top up the agent's fund if low
fund_agent_if_low(user.wallet.address())

###################################################
################ FLASK SERVER CODE ################
###################################################

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Your routes go here

# Define function to send a summarization request
async def send_summarization_request(extension_data):
    INPUT_TEXT = extension_data['content']
    await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
    ctx.storage.set("sent_payloads", ctx.storage.get("sent_payloads") + [extension_data])  # Remember the sent payload

# Define a global variable to store the extension data
extension_data = None

# Modify the Flask route to store the data in the global variable
@app.route('/extension', methods=['POST'])
def receive_extension_data():
    global extension_data
    payload = request.get_json()  # Get the payload from the request
    print(f"RECEIVED PAYLOAD FROM EXTENSION: {payload}")  # Print the payload
    extension_data = payload  # Store the payload in the global variable
    asyncio.run(send_summarization_request(payload))
    return 'PAYLOAD RECEIVED BY USER AGENT', 200  # Send a response back to the extension

# Define function to run the server
def run_server():
    app.run(port=3001)  # Run the Flask server on a different port

# Run the server in a separate thread so it doesn't block the main script
server_thread = Thread(target=run_server)
server_thread.start()

# Define route to get the summarized text
@app.route('/get_summary', methods=['GET'])
def get_summary():
    summarized_text = g.summarized_text  # Get the summarized text from the global g object
    summarized_text = ctx.storage.get("SummarizedText")  # Get the summarized text from the storage
    if summarized_text:
        return jsonify(summarized_text=summarized_text)  # If the summarized text exists, send it as a response
    else:
        return jsonify(message="No summarized text available"), 404  # If the summarized text does not exist, send a 404 response

##########################################################
################ END OF FLASK SERVER CODE ################
##########################################################
    


##########################################################
################ USER AGENT CODE #########################
##########################################################

# Define event to initialize the storage when the agent starts up
@user.on_event("startup")
async def initialize_storage(ctx: Context):
    ctx.storage.set("SummarizationDone", False)  # Set the "SummarizationDone" flag to False

# Create an instance of Protocol with a label "T5BaseModelUser"
t5_base_user = Protocol(name="T5BaseModelUser", version="0.0.1")

# Define interval event to send a summarization request every 30 seconds
@t5_base_user.on_interval(period=30, messages=SummarizationRequest)
async def transcript(ctx: Context):
    global extension_data
    if extension_data is not None:  # Check if there's new extension data
        if extension_data not in ctx.storage.get("sent_payloads"):
            INPUT_TEXT = extension_data['content']
            await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
            ctx.storage.set("sent_payloads", ctx.storage.get("sent_payloads") + [extension_data])  # Remember the sent payload

        SummarizationDone = ctx.storage.get("SummarizationDone")  # Get the "SummarizationDone" flag from the storage

        # If the extension data exists and the summarization has not been done yet, send a summarization request
        if not SummarizationDone:
            html_content = extension_data['content']
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find the element with itemprop="articleBody"
            article_body = soup.find(attrs={"itemprop": "articleBody"})
            
            if article_body is not None:
                # Find all paragraph elements within the article body
                paragraphs = article_body.find_all('p')
                
                # Extract the text from each paragraph and join them with a space in between
                INPUT_TEXT = ' '.join(p.get_text() for p in paragraphs)

                ctx.logger.info(f"Updated INPUT_TEXT: {INPUT_TEXT}")  # Log the updated INPUT_TEXT

                await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
                ctx.logger.info("Sent a summarization request to the base user agent")  # Log the sent request

@t5_base_user.on_message(model=SummarizationResponse)
async def handle_data(ctx: Context, sender: str, response: SummarizationResponse):
    extension_server_url = "http://localhost:3001/extension"
    payload = {"summarized_text": response.summarized_text}
    requests.post(extension_server_url, json=payload)  # Send the summarized text back to the Flask server
    ctx.storage.set("SummarizationDone", False)  # Reset the SummarizationDone flag

    ctx.logger.info(f"Summarized text:  {response.summarized_text}")
    ctx.storage.set("SummarizationDone", True)
    ctx.storage.set("SummarizedText", response.summarized_text)
    ctx.storage.set("INPUT_TEXT", "")  # Reset the INPUT_TEXT

    # Send the summarized text back to the extension
    extension_server_url = "http://localhost:3001"  # Replace with the URL of your extension's server
    payload = {"summarized_text": response.summarized_text}
    response = requests.post(extension_server_url, json=payload)

    if response.status_code == 200:
        ctx.logger.info("Successfully sent summarized text to the extension.")
    else:
        ctx.logger.error(f"Failed to send summarized text to the extension. Status code: {response.status_code}")

# Define message event to handle errors
@t5_base_user.on_message(model=Error)
async def handle_error(ctx: Context, sender: str, error: Error):
    ctx.logger.info(f"Got error from uagent: {error}")  # Log the error

# Include the protocol in the user agent and publish the manifest
user.include(t5_base_user, publish_manifest=True)

# Initiate the task
if __name__ == "__main__":
    t5_base_user.run()  # Run the protocol