#!/bin/bash

# Start the signaling server in the background
echo "Starting signaling server..."
cd signaling-server && npm start &
SIGNALING_PID=$!

# Wait for the signaling server to start
sleep 2

# Start the frontend application
echo "Starting frontend application..."
npm run dev

# When the frontend is stopped, also stop the signaling server
echo "Stopping signaling server..."
kill $SIGNALING_PID