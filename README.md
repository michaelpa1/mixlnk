# Mixlnk Audio Streaming Application

This application allows users to stream audio in real-time and share audio files with others.

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Running the Application Locally

1. **Start the Signaling Server**

   ```bash
   cd signaling-server
   npm install
   npm start
   ```

   This will start the WebRTC signaling server on port 3000.

2. **Start the Frontend Application**

   In a new terminal window:

   ```bash
   npm install
   npm run dev
   ```

   This will start the Vite development server on port 5173.

3. **Access the Application**

   Open your browser and navigate to:
   
   ```
   http://localhost:5173
   ```

## Docker Setup

For a more production-like environment and to avoid localhost WebRTC issues, you can use Docker:

1. **Build and Start the Containers**

   ```bash
   docker-compose up --build
   ```

   This will:
   - Build and start the signaling server on port 3000
   - Build and start the frontend application on port 5173
   - Configure the frontend to connect to the signaling server container

2. **Access the Application**

   Open your browser and navigate to:
   
   ```
   http://localhost:5173
   ```

## Testing the Application

We've created several tools and guides to help test the WebRTC audio streaming functionality:

### Testing with the Actual Application

For detailed instructions on how to test the streaming using the actual application pages (dashboard and receiver pages), please refer to the [Testing Guide](./testing-guide.md).

This guide includes:
- Step-by-step instructions for testing with the broadcaster and listener pages
- Troubleshooting tips for common issues
- Different testing scenarios to verify the functionality

### Testing Tools

We've also created specialized testing tools for more isolated testing:

1. **WebRTC Connection Test**: A Node.js script that tests the signaling process
2. **Audio Streaming Test Page**: A standalone HTML page for testing audio streaming
3. **Automated Test Script**: A shell script that runs both tests automatically

For details on using these tools, see the [Testing Guide](./testing-guide.md).

### AI-Assisted Testing

If you're working with an AI assistant (like Claude), we've created a set of example prompts you can use to ask the AI to help you test the application:

- [AI Test Prompts](./ai-test-prompts.md)

These prompts cover various testing scenarios, from running the basic tests to troubleshooting specific issues, and can help you effectively communicate your testing needs to an AI assistant.

## Troubleshooting

### Connection Issues

If you experience connection timeouts or issues with the stream:

1. Make sure both the signaling server and frontend application are running
2. Check browser console for any errors
3. Try using the Docker setup to avoid localhost WebRTC limitations
4. Ensure your browser has permission to access your microphone
5. Run the testing tools to diagnose specific issues

### Audio Stream Issues

If the audio stream stops when a listener connects:

1. This is a known issue with the current implementation
2. We've implemented a fix by cloning audio tracks when sharing with listeners
3. Use the audio streaming test page to verify the fix is working
4. If issues persist, try using the Docker setup

## Architecture

The application consists of two main components:

1. **Signaling Server**: A WebSocket server that facilitates the WebRTC connection process
2. **Frontend Application**: A React application that handles the user interface and audio streaming

WebRTC is used for peer-to-peer audio streaming, with the signaling server only used for connection establishment.