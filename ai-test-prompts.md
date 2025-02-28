# AI Test Prompts for Mixlnk Audio Streaming

This document provides example prompts you can use to ask an AI assistant (like Claude) to help you test the Mixlnk audio streaming functionality.

## General Testing Prompts

### Running the Basic Tests

```
Please help me test the Mixlnk audio streaming application. Run the automated test script and report the results.
```

```
I need to verify if the WebRTC connection is working in my Mixlnk application. Can you run the test-webrtc-connection.js script and analyze the results?
```

```
Please open the test-audio-streaming.html page and help me test the audio streaming functionality. I'll provide feedback on what I see in the browser.
```

### Testing with Docker

```
I want to test the Mixlnk application using Docker to avoid localhost WebRTC limitations. Please help me run the Docker setup and test the streaming functionality.
```

```
Can you help me build and run the Docker containers for Mixlnk, then guide me through testing the audio streaming functionality?
```

## Testing the Actual Application

### Starting the Application

```
Please start both the signaling server and the frontend application for Mixlnk, then guide me through testing the audio streaming functionality using the actual application pages.
```

```
I need to test the Mixlnk audio streaming. Can you start the application using the start-app.sh script and then walk me through the testing process?
```

### Guided Testing Process

```
I have the Mixlnk application running. Can you guide me step-by-step through testing the audio streaming functionality? I need to test both broadcasting and listening.
```

```
I'm having issues with the Mixlnk audio streaming. Can you help me diagnose the problem by guiding me through a systematic testing process using both the application pages and the testing tools?
```

## Troubleshooting Specific Issues

### Connection Issues

```
The Mixlnk stream receiver is showing a connection timeout error. Can you help me diagnose and fix this issue?
```

```
When I try to connect to a Mixlnk stream, I get a "Signaling server connection failed" error. Can you help me troubleshoot this?
```

### Audio Stream Issues

```
When a listener connects to my Mixlnk stream, my audio stops broadcasting. Can you help me fix this issue?
```

```
I'm not seeing any audio levels in the Mixlnk stream receiver page. Can you help me troubleshoot this audio issue?
```

## Extending or Modifying the Tests

```
I'd like to enhance the Mixlnk testing tools to include [specific feature]. Can you help me modify the test scripts?
```

```
Can you help me create a new test for the Mixlnk application that focuses specifically on [specific aspect] of the audio streaming functionality?
```

## Tips for Effective AI-Assisted Testing

1. **Be specific about what you're testing**: Mention which part of the application you want to test (e.g., broadcaster page, listener page, connection process).

2. **Provide context**: Let the AI know what you've already tried or what specific issues you're encountering.

3. **Share error messages**: If you're seeing errors, share the exact error messages and where they appear.

4. **Share screenshots**: If possible, share screenshots of what you're seeing in the browser to help the AI understand the current state.

5. **Follow step-by-step**: Work through the AI's suggestions one step at a time, providing feedback after each step.