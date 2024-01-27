import os, requests, asyncio
from uagents import Agent, Context, Protocol
from messages.t5_base import SummarizationRequest, SummarizationResponse, Error
from uagents.setup import fund_agent_if_low
from flask import Flask, request, jsonify
from threading import Thread
from flask_cors import CORS
import logging

logging.basicConfig(filename="~/Viceroy/uAgents/integrations/t5-base/src/user-agent.log", level=logging.INFO)

# THIS IS THE USER'S AGENT -- AGENT NUMBER 1 IN THE ARCHITECTURE

# Replace this input with the text you want to summarize
# INPUT_TEXT = ""

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

flask = Flask(__name__)
CORS(flask)  # This will enable CORS for all routes

# Define a global variable to store the extension data and summarized text
extension_data = None
summarized_text = None

# flasklication routes
# Modify the Flask route to store the data in the global variable
@flask.route('/extension', methods=['POST'])
def receive_extension_data():
    global extension_data
    payload = request.get_json()  # Get the payload from the request

    # Check if 'content' key is in the payload
    if 'content' in payload:
        # Clean up the content
        content = payload['content']
        clean_content = ' '.join(content.split())
        payload['content'] = clean_content

        print(f"PAYLOAD FROM EXTENSION: {payload}")  # Print the cleaned payload
        extension_data = payload  # Store the cleaned payload in the global variable

        return 'PAYLOAD RECEIVED BY USER AGENT', 200  # Send a response back to the extension
    else:
        return 'No content in payload', 400  # Send an error response back to the extension

# Flask summarized text route
@flask.route('/summarized_text', methods=['POST', 'GET'])
def receive_summarized_text():
    global summarized_text
    if request.method == 'POST':
        payload = request.get_json()  # Get the payload from the request
        summarized_text = payload['summarized_text']  # Store the summarized text in the global variable
        return 'SUMMARIZED TEXT POSTED TO SERVER BY AGENT', 200  # Send a response back to the extension
    elif request.method == 'GET':
        return jsonify(summarized_text=summarized_text), 200

# Define function to run the server
def run_server():
    flask.run(port=3001)  # Run the Flask server on a different port

# Run the server in a separate thread so it doesn't block the main script
server_thread = Thread(target=run_server)
server_thread.start()

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
    # Log the function call
    ctx.logger.info("TRANSCRIPT FUNCTION CALLED")
    # Get the extension data from the global variable
    global extension_data
    # Log the extension data
    ctx.logger.info(f"VALUE OF EXTENSION DATA: {extension_data}")
    # Check if the extension data exists
    if extension_data is not None:  # Check if there's new extension data
        # Get the sent payloads from the storage
        sent_payloads = ctx.storage.get("sent_payloads")
        # If sent_payloads is None, initialize it to an empty list
        if sent_payloads is None:
            sent_payloads = []
        ctx.logger.info(f"VALUE OF SENT PAYLOADS: {sent_payloads}")
        # If the extension data is not in the sent payloads, send a summarization request
        if extension_data not in sent_payloads:
            INPUT_TEXT = extension_data['content']
            ctx.logger.info(f"Value of INPUT_TEXT: {INPUT_TEXT}")
            await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
            ctx.logger.info("AGENT SENDS SUMMARIZATION REQUEST TO BASE AGENT")
            # Add the extension data to the sent payloads and save it in the storage
            sent_payloads.append(extension_data)
            ctx.storage.set("sent_payloads", sent_payloads)

        SummarizationDone = ctx.storage.get("SummarizationDone")  # Get the "SummarizationDone" flag from the storage
        ctx.logger.info(f"VALUE OF SummarizationDone: {SummarizationDone}")
        # If the extension data exists and the summarization has not been done yet, send a summarization request
        if not SummarizationDone:
            INPUT_TEXT = extension_data['content']
            ctx.logger.info(f"Updated INPUT_TEXT: {INPUT_TEXT}")  # Log the updated INPUT_TEXT

            await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
            ctx.logger.info("SENT A SUMMARIZATION REQUEST TO BASE AGENT")  # Log the sent request

            # else, reset extension_data to None
        else:
            extension_data = None
            ctx.logger.info("Reset extension_data to None")

# handle_data function
@t5_base_user.on_message(model=SummarizationResponse)
async def handle_data(ctx: Context, sender: str, summarization_response: SummarizationResponse):
    global summarized_text
    # Log the summarized text
    ctx.logger.info(f"handle_data function called. Summarized text: {summarization_response.summarized_text}")
    ctx.logger.info(f"Summarized text:  {summarization_response.summarized_text}")
    
    # Store the summarized text in the global variable
    summarized_text = summarization_response.summarized_text

    # Send the summarized text back to the extension
    extension_server_url = "http://localhost:3001/summarized_text"  # Replace with the URL of your extension's server
    payload = {"summarized_text": summarization_response.summarized_text}
    post_response = requests.post(extension_server_url, json=payload)

    if post_response.status_code == 200:
        ctx.logger.info(f"Successfully sent summarized text to the extension. {post_response.text}")
    else:
        ctx.logger.error(f"Failed to send summarized text to the extension. Status code: {post_response.status_code}")

# Define message event to handle errors
@t5_base_user.on_message(model=Error)
async def handle_error(ctx: Context, sender: str, error: Error):
    ctx.logger.info(f"Got error from uagent: {error}")  # Log the error

# Include the protocol in the user agent and publish the manifest
user.include(t5_base_user, publish_manifest=True)

# Initiate the task
if __name__ == "__main__":
    t5_base_user.run()  # Run the protocol