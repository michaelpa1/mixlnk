#!/bin/bash

# Check if signaling server is running
if ! pgrep -f "node server.js" > /dev/null; then
    echo "Starting signaling server..."
    cd signaling-server && npm start &
    SIGNALING_PID=$!
    
    # Wait for the signaling server to start
    sleep 3
    echo "Signaling server started."
else
    echo "Signaling server is already running."
fi

# Install required dependencies for the test
echo "Installing test dependencies..."
npm install socket.io-client uuid

# Run the WebRTC connection test
echo "Running WebRTC connection test..."
node test-webrtc-connection.js
# Note: This script now uses ES module syntax (import instead of require)

# Open the audio streaming test page
echo "Opening audio streaming test page..."
open test-audio-streaming.html

echo ""
echo "Test setup complete!"
echo "1. The WebRTC connection test has been run in the terminal."
echo "2. The audio streaming test page has been opened in your browser."
echo ""
echo "To test audio streaming:"
echo "  - In the left panel: Select an audio source and click 'Start Broadcasting'"
echo "  - In the right panel: The Stream ID should be auto-filled. Click 'Connect to Stream'"
echo "  - You should see audio level meters moving in both panels if the connection is successful"
echo ""
echo "Press Ctrl+C to stop the test and clean up resources."

# Wait for user to press Ctrl+C
trap "echo 'Stopping tests...'; kill $SIGNALING_PID 2>/dev/null; exit" INT
wait