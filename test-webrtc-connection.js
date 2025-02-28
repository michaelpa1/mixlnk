/**
 * WebRTC Connection Test Script
 *
 * This script tests the WebRTC connection between two peers using the signaling server.
 * It simulates both a broadcaster and a listener to verify the connection works.
 */

import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL || 'http://localhost:3000';
const TEST_DURATION = 10000; // 10 seconds

console.log(`\n🔍 WebRTC Connection Test`);
console.log(`========================\n`);
console.log(`Signaling Server: ${SIGNALING_SERVER_URL}`);
console.log(`Test Duration: ${TEST_DURATION / 1000} seconds\n`);

// Create two socket connections (broadcaster and listener)
console.log(`1. Creating socket connections...`);
const broadcasterSocket = io(SIGNALING_SERVER_URL, {
  reconnectionAttempts: 3,
  timeout: 5000
});

const listenerSocket = io(SIGNALING_SERVER_URL, {
  reconnectionAttempts: 3,
  timeout: 5000
});

// Test variables
const streamId = Math.random().toString(36).substring(2, 10);
const listenerId = Math.random().toString(36).substring(2, 10);
let broadcasterConnected = false;
let listenerConnected = false;
let offerSent = false;
let answerSent = false;
let iceCandidatesExchanged = false;

// Broadcaster socket events
broadcasterSocket.on('connect', () => {
  broadcasterConnected = true;
  console.log(`✅ Broadcaster connected to signaling server`);
  
  // Register a stream
  console.log(`2. Registering stream with ID: ${streamId}`);
  broadcasterSocket.emit('register-stream', { streamId });
});

broadcasterSocket.on('connect_error', (error) => {
  console.error(`❌ Broadcaster connection error:`, error.message);
});

broadcasterSocket.on('join-stream-request', (data) => {
  console.log(`✅ Received join-stream-request from listener: ${data.listenerId}`);
  
  // Simulate sending an offer
  console.log(`4. Broadcaster sending offer to listener`);
  broadcasterSocket.emit('offer', {
    listenerId: data.listenerId,
    offer: { type: 'offer', sdp: 'test-sdp-offer' }
  });
  offerSent = true;
});

broadcasterSocket.on('answer', (data) => {
  console.log(`✅ Received answer from listener: ${data.userId}`);
  answerSent = true;
  
  // Simulate ICE candidate exchange
  console.log(`6. Exchanging ICE candidates`);
  broadcasterSocket.emit('ice-candidate', {
    listenerId: data.userId,
    candidate: { candidate: 'test-ice-candidate-broadcaster', sdpMid: '0', sdpMLineIndex: 0 }
  });
  iceCandidatesExchanged = true;
});

// Listener socket events
listenerSocket.on('connect', () => {
  listenerConnected = true;
  console.log(`✅ Listener connected to signaling server`);
  
  // Wait for broadcaster to register stream
  setTimeout(() => {
    // Join the stream
    console.log(`3. Listener requesting to join stream: ${streamId}`);
    listenerSocket.emit('join-stream-request', {
      streamId,
      listenerId
    });
  }, 1000);
});

listenerSocket.on('connect_error', (error) => {
  console.error(`❌ Listener connection error:`, error.message);
});

listenerSocket.on('offer', (data) => {
  if (data.listenerId === listenerId) {
    console.log(`✅ Received offer from broadcaster`);
    
    // Simulate sending an answer
    console.log(`5. Listener sending answer to broadcaster`);
    listenerSocket.emit('answer', {
      streamId,
      listenerId,
      answer: { type: 'answer', sdp: 'test-sdp-answer' }
    });
  }
});

listenerSocket.on('ice-candidate', (data) => {
  if (data.streamId === streamId) {
    console.log(`✅ Received ICE candidate from broadcaster`);
    
    // Simulate sending ICE candidate
    listenerSocket.emit('ice-candidate', {
      streamId,
      candidate: { candidate: 'test-ice-candidate-listener', sdpMid: '0', sdpMLineIndex: 0 }
    });
  }
});

// Run the test for a fixed duration
setTimeout(() => {
  console.log(`\n📊 Test Results:`);
  console.log(`==============`);
  console.log(`Broadcaster Connected: ${broadcasterConnected ? '✅' : '❌'}`);
  console.log(`Listener Connected: ${listenerConnected ? '✅' : '❌'}`);
  console.log(`Offer Sent: ${offerSent ? '✅' : '❌'}`);
  console.log(`Answer Sent: ${answerSent ? '✅' : '❌'}`);
  console.log(`ICE Candidates Exchanged: ${iceCandidatesExchanged ? '✅' : '❌'}`);
  
  const allPassed = broadcasterConnected && listenerConnected && offerSent && answerSent && iceCandidatesExchanged;
  
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
  
  // Clean up
  broadcasterSocket.disconnect();
  listenerSocket.disconnect();
  
  process.exit(allPassed ? 0 : 1);
}, TEST_DURATION);