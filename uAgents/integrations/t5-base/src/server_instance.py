from flask import ctx
from flask_server import Server  # Import the Server class

# ... Your existing code to define the agent and protocols ...

# Create an instance of the Server class
server = Server(ctx)

# Run the server in a separate thread to avoid blocking the main thread
from threading import Thread
Thread(target=server.run).start()