const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Add a basic route for the root path
app.get('/', (req, res) => {
  res.send(`
    <h1>Mixlnk Signaling Server</h1>
    <p>Status: Running</p>
    <p>This server handles WebSocket connections for the audio streaming application.</p>
    <p>Please access the frontend application at: <a href="http://localhost:5173">http://localhost:5173</a></p>
  `);
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin for testing
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000 // Increase ping interval
});

const activeStreams = new Map();
const activeConnections = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('register-stream', ({ streamId }) => {
    console.log(`Stream registered: ${streamId} by ${socket.id}`);
    activeStreams.set(streamId, socket.id);
    socket.join(`stream:${streamId}`);
  });
  
  socket.on('join-stream-request', ({ streamId, listenerId }) => {
    const broadcasterId = activeStreams.get(streamId);
    if (broadcasterId) {
      activeConnections.set(listenerId, socket.id);
      io.to(broadcasterId).emit('join-stream-request', { streamId, listenerId });
    } else {
      socket.emit('error', { message: 'Stream not found' });
    }
  });
  
  socket.on('offer', ({ listenerId, offer }) => {
    const listenerSocketId = activeConnections.get(listenerId);
    if (listenerSocketId) {
      io.to(listenerSocketId).emit('offer', { listenerId, offer });
    }
  });
  
  socket.on('answer', ({ streamId, listenerId, answer }) => {
    const broadcasterId = activeStreams.get(streamId);
    if (broadcasterId) {
      io.to(broadcasterId).emit('answer', { userId: listenerId, answer });
    }
  });
  
  socket.on('ice-candidate', (data) => {
    if (data.listenerId) {
      const listenerSocketId = activeConnections.get(data.listenerId);
      if (listenerSocketId) {
        io.to(listenerSocketId).emit('ice-candidate', {
          streamId: data.streamId,
          candidate: data.candidate
        });
      }
    } else if (data.streamId) {
      const broadcasterId = activeStreams.get(data.streamId);
      if (broadcasterId) {
        io.to(broadcasterId).emit('ice-candidate', {
          userId: socket.id,
          candidate: data.candidate
        });
      }
    }
  });
  
  socket.on('end-stream', ({ streamId }) => {
    if (activeStreams.get(streamId) === socket.id) {
      activeStreams.delete(streamId);
      io.to(`stream:${streamId}`).emit('stream-ended');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up broadcaster streams
    for (const [streamId, broadcasterId] of activeStreams.entries()) {
      if (broadcasterId === socket.id) {
        activeStreams.delete(streamId);
        io.to(`stream:${streamId}`).emit('stream-ended');
      }
    }
    
    // Clean up listener connections
    for (const [listenerId, socketId] of activeConnections.entries()) {
      if (socketId === socket.id) {
        activeConnections.delete(listenerId);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});