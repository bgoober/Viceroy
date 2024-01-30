from flask import Flask, request, jsonify
from flask_cors import CORS
from threading import Thread

class Server:
    def __init__(self, ctx):
        self.app = Flask(__name__)
        CORS(self.app)
        self.ctx = ctx
        self.latest_payload = None  # Define the instance variable "latest_payload"
        self.summarized_text = None  # Define the instance variable "summarized_text"


        @self.app.route('/extension', methods=['POST', 'GET'])
        def handle_extension():  
            if request.method == 'POST':
                payload = request.get_json()
                print(f"RECEIVED PAYLOAD FROM EXTENSION: {payload}")
                # Check if 'content' is in the payload
                if 'content' in payload:
                    # Clean up the content
                    content = payload['content']
                    clean_content = ' '.join(content.split())
                    # Store the cleaned content back in the payload
                    payload['content'] = clean_content
                # Store the payload in the latest_payload variable
                self.latest_payload = payload
                Thread(target=self.send_summarization_request, args=(payload,)).start()
                return 'PAYLOAD SENT TO /EXTENSION ENDPOINT', 200
            elif request.method == 'GET':
                # Return the latest payload as a JSON response
                return jsonify(self.latest_payload), 200

        @self.app.route('/summarized_text', methods=['POST', 'GET'])
        def get_summary():
            if request.method == 'POST':
                self.summarized_text = request.json['summarized_text']
                return jsonify({'message': 'Summarized text received'}), 200
            elif request.method == 'GET':
                if self.summarized_text is not None:
                    return jsonify({'summary': self.summarized_text})
                else:
                    return jsonify({'error': 'No summarized text available'}), 204
                
    def send_summarization_request(self, extension_data):
        with self.app.app_context():  # Set up an application context
            if 'content' in extension_data:
                # Clean up the content
                clean_content = ' '.join(extension_data['content'].split())
                INPUT_TEXT = clean_content
                # Store the cleaned content back in the payload
                extension_data['content'] = clean_content
                self.sent_payloads = getattr(self, "sent_payloads", []) + [extension_data]  # Use self to store the payloads
            else:
                print("Error: 'content' not in extension_data")

    def run(self):
        self.app.run(port=3001)