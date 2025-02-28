# Testing Guide for Mixlnk Audio Streaming

This guide provides detailed instructions on how to test the audio streaming functionality using both the testing tools and the actual application pages.

## Testing with the Actual Application Pages

### Prerequisites
- Make sure both servers are running (signaling server and frontend application)
- A browser with microphone access permissions
- Preferably two browser windows or tabs (one for broadcasting, one for listening)

### Step-by-Step Testing Process

1. **Start the Required Servers**
   ```bash
   # Either use the convenience script
   ./start-app.sh
   
   # Or start both servers manually
   # Terminal 1: Start the signaling server
   cd signaling-server && npm start
   
   # Terminal 2: Start the frontend application
   npm run dev
   ```

2. **Broadcaster Setup**
   - Open your browser and navigate to: `http://localhost:5173`
   - Go to the Broadcast Studio section
   - Select an audio source from the dropdown menu
   - Click "Start Broadcasting"
   - Once streaming begins, you'll see a shareable link
   - Copy this link (it should look like `http://localhost:5173/stream/[stream-id]`)

3. **Listener Setup**
   - Open a new browser window or incognito window
   - Paste the shareable link you copied
   - You should see the "Connecting to stream..." message
   - If everything works correctly, you should see the stream page with audio levels

4. **Verify the Connection**
   - On the broadcaster page, you should see the listener appear in the listeners list
   - The audio levels should be visible on both the broadcaster and listener pages
   - The broadcaster's audio should continue working even with the listener connected
   - Try speaking or playing audio to verify the stream is working

5. **Test Different Scenarios**
   - Try connecting multiple listeners to the same stream
   - Try stopping and restarting the stream
   - Try disconnecting and reconnecting listeners

### Troubleshooting During Testing

If you encounter issues during testing:

1. **Check the Console Logs**
   - Open the browser developer tools (F12 or right-click > Inspect)
   - Look for any errors in the Console tab
   - Our enhanced logging should provide detailed information about what's happening

2. **Check the Signaling Server Terminal**
   - The signaling server terminal should show connection events
   - Look for messages about clients connecting, stream registration, and WebRTC signaling

3. **Verify Network Connectivity**
   - In the Network tab of developer tools, verify that WebSocket connections are established
   - Check that there are no CORS errors

4. **Try the Docker Setup**
   - If localhost testing continues to be problematic, try the Docker setup:
     ```bash
     docker-compose up --build
     ```
   - Then access the application at `http://localhost:5173`

## Using the Testing Tools

For more isolated testing of the WebRTC functionality, you can use the provided testing tools:

1. **WebRTC Connection Test**
   ```bash
   # Install dependencies
   npm install socket.io-client uuid
   
   # Run the test
   node test-webrtc-connection.js
   ```

2. **Audio Streaming Test Page**
   ```bash
   # Open the test page in your browser
   open test-audio-streaming.html
   ```

3. **Automated Test Script**
   ```bash
   # Make the script executable
   chmod +x run-webrtc-test.sh
   
   # Run the tests
   ./run-webrtc-test.sh
   ```

These testing tools provide a more controlled environment for diagnosing specific issues with the WebRTC connection and audio streaming functionality.