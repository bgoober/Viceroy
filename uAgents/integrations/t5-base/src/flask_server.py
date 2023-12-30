from flask import Flask, request
from threading import Thread

app = Flask(__name__)

@app.route('/extension', methods=['POST'])
def receive_extension_data():
    payload = request.get_json()
    print(payload)  # Process the payload as needed
    # Here you can add code to send the payload to the agent
    return 'Payload received', 200

def run_server():
    app.run(port=3001)  # Run the Flask server on a different port

# Run the server in a separate thread so it doesn't block the main script
server_thread = Thread(target=run_server)
server_thread.start()

# The rest of your agent code goes here...