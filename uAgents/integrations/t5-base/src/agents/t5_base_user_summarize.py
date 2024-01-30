import os, requests, logging, time
from uagents import Agent, Context, Protocol
from messages.t5_base import SummarizationRequest, SummarizationResponse, Error
from uagents.setup import fund_agent_if_low

logging.basicConfig(filename="~/Viceroy/uAgents/integrations/t5-base/src/user-agent.log", level=logging.INFO)

# THIS IS THE USER'S AGENT -- AGENT NUMBER 1 IN THE ARCHITECTURE

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

##########################################################
################ USER AGENT CODE #########################
##########################################################

# Define event to initialize the storage when the agent starts up
@user.on_event("startup")
async def initialize_storage(ctx: Context):
    ctx.storage.set("SummarizationDone", False)  # Set the "SummarizationDone" flag to False
    ctx.storage.set("sent_payloads", [])  # Clear the "sent_payloads" storage object
    
# Create an instance of Protocol with a label "T5BaseModelUser"
t5_base_user = Protocol(name="T5BaseModelUser", version="0.0.1")

def get_extension_data():
    while True:
        response = requests.get('http://localhost:3001/extension')
        print(f"Response status code: {response.status_code}")
        print(f"Response data: {response.text}")
        if response.status_code == 200:
            extension_data = response.json()
            print(f"Extension data: {extension_data}")
            if extension_data is not None:
                return extension_data
        else:
            print(f"Error: {response.status_code}")
        time.sleep(5)  # Wait for 5 seconds before making the next request

# Define interval event to send a summarization request every 30 seconds
@t5_base_user.on_interval(period=30, messages=SummarizationRequest) 
async def transcript(ctx: Context):
    # Log the function call
    ctx.logger.info("TRANSCRIPT FUNCTION CALLED")
    # Get the extension data from the get_extension_data function
    global extension_data
    extension_data = get_extension_data()
    # Log the extension data
    ctx.logger.info(f"VALUE OF EXTENSION DATA: {extension_data}")
    # Check if the extension data exists
    if extension_data is not None:  # Check if there's new extension data
        # Extract the content from the extension data and assign it to INPUT_TEXT
        INPUT_TEXT = extension_data['content']
        ctx.logger.info(f"Value of INPUT_TEXT: {INPUT_TEXT}")
        # Get the sent payloads from the storage
        sent_payloads = ctx.storage.get("sent_payloads")
        # If sent_payloads is None, initialize it to an empty list
        if sent_payloads is None:
            sent_payloads = []
        ctx.logger.info(f"VALUE OF SENT PAYLOADS: {sent_payloads}")
        # If the extension data is not in the sent payloads, send a summarization request
        if extension_data not in sent_payloads:
            await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
            ctx.logger.info("AGENT SENDS SUMMARIZATION REQUEST TO BASE AGENT")
            sent_payloads.append(extension_data)
            ctx.storage.set("sent_payloads", sent_payloads)
        else:
            ctx.logger.info("Extension data already in sent payloads. Not sending summarization request.")

        # Clear old entries from the sent_payloads list if it's too long
        if len(sent_payloads) > 1:  # Adjust this value as needed
            sent_payloads = sent_payloads[-100:]  # Keep only the last 100 entries
            ctx.storage.set("sent_payloads", sent_payloads)
        # Reset extension_data to None after it's processed
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