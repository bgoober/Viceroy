# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
from messages.t5_base import SummarizationRequest

class Server:
    def __init__(self, ctx, agent_address):
        self.app = Flask(__name__)
        CORS(self.app)
        self.ctx = ctx
        self.agent_address = agent_address
        self.extension_data = None
        self.summarized_text = None

        @self.app.route('/extension', methods=['POST'])
        def receive_extension_data():
            payload = request.get_json()
            print(f"RECEIVED PAYLOAD FROM EXTENSION: {payload}")
            self.extension_data = payload
            asyncio.run(self.send_summarization_request(payload))
            return 'PAYLOAD RECEIVED BY USER AGENT', 200

        @self.app.route('/get_summary', methods=['GET'])
        def get_summary():
            print(f"Value of summarized_text when /get_summary is hit: {self.summarized_text}")
            if self.summarized_text is not None:
                return jsonify({'summary': self.summarized_text})
            else:
                return jsonify({'error': 'No summarized text available'}), 404

    async def send_summarization_request(self, extension_data):
        INPUT_TEXT = extension_data['content']
        await self.ctx.send(self.agent_address, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
        self.ctx.storage.set("sent_payloads", self.ctx.storage.get("sent_payloads") + [extension_data])

    def run(self):
        self.app.run(port=3001)


################ FLASK SERVER CODE ################
###################################################

#app = Flask(__name__)
#CORS(app)  # This will enable CORS for all routes

# Define a global variable to store the extension data and summarized text
#extension_data = None
#summarized_text = None
# Your routes go here

# Define function to send a summarization request
#async def send_summarization_request(ctx, extension_data):
  #  INPUT_TEXT = extension_data['content']
 #   await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {INPUT_TEXT}"))
#    ctx.storage.set("sent_payloads", ctx.storage.get("sent_payloads") + [extension_data])  # Remember the sent payload

# Modify the Flask route to store the data in the global variable
#@app.route('/extension', methods=['POST'])
#def receive_extension_data():
  #  global extension_data
 #   payload = request.get_json()  # Get the payload from the request
 #   print(f"RECEIVED PAYLOAD FROM EXTENSION: {payload}")  # Print the payload
 #   extension_data = payload  # Store the payload in the global variable
 #   asyncio.run(send_summarization_request(user.ctx, payload))
 #   return 'PAYLOAD RECEIVED BY USER AGENT', 200  # Send a response back to the extension

# Define function to run the server
#def run_server():
 #   app.run(port=3001)  # Run the Flask server on a different port

# Run the server in a separate thread so it doesn't block the main script
#server_thread = Thread(target=run_server)
#server_thread.start()

# Define route to get the summarized text
#@app.route('/get_summary', methods=['GET'])
#def get_summary():
   # global summarized_text
   # print(f"Value of summarized_text when /get_summary is hit: {summarized_text}")
   # if summarized_text is not None:
        # If the summarized text exists, send it as a response
   #     return jsonify({'summary': summarized_text})
  #  else:
        # If the summarized text does not exist, send a 404 response
  #      return jsonify({'error': 'No summarized text available'}), 404
    
##########################################################
################ END OF FLASK SERVER CODE ################
##########################################################