import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter';

export class AudioStreamingService {
  private peerConnections: Record<string, RTCPeerConnection> = {};
  private streamId: string | null = null;
  private socket: Socket | null = null;
  private events: EventEmitter;
  private mediaStream: MediaStream | null = null;
  private hasSignalingServerError = false;

  constructor() {
    this.events = new EventEmitter();
  }

  // Add method to connect to a stream
  async connectToStream(streamId: string): Promise<MediaStream> {
    console.log('AudioStreamingService - Connecting to stream:', streamId);
    
    if (!this.socket) {
      console.log('AudioStreamingService - Socket not initialized, initializing now');
      this.initializeSocket();
    }
    
    // Check if we had a signaling server error
    if (this.hasSignalingServerError) {
      console.error('AudioStreamingService - Signaling server unavailable');
      throw new Error('Cannot connect to stream: Signaling server unavailable. Please make sure the signaling server is running.');
    }
    
    // Safety check - make sure socket is initialized
    if (!this.socket) {
      console.error('AudioStreamingService - Socket initialization failed');
      throw new Error('Failed to initialize socket connection');
    }
    
    console.log('AudioStreamingService - Socket connected:', this.socket.connected);
    
    // Create a new peer connection with enhanced ICE servers configuration
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    });
    
    // Create a media stream to return
    const resultStream = new MediaStream();
    
    // Set up event handlers
    peerConnection.ontrack = (event) => {
      console.log('AudioStreamingService - Received tracks');
      event.streams[0].getTracks().forEach(track => {
        resultStream.addTrack(track);
      });
    };
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        console.log('AudioStreamingService - Sending ICE candidate');
        this.socket.emit('ice-candidate', {
          streamId: streamId,
          candidate: event.candidate
        });
      }
    };
    
    // Store socket in local variable to avoid null checks
    const socket = this.socket;
    
    // Set up listeners for socket events
    socket.on('offer', async (data: { streamId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.streamId === streamId) {
        try {
          console.log('AudioStreamingService - Received offer, setting remote description');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          console.log('AudioStreamingService - Sending answer');
          socket.emit('answer', {
            streamId: streamId,
            answer: answer
          });
        } catch (error) {
          console.error('AudioStreamingService - Error handling offer:', error);
          this.events.emit('error', 'Connection error');
        }
      }
    });
    
    socket.on('ice-candidate', async (data: { streamId: string; candidate: RTCIceCandidateInit }) => {
      if (data.streamId === streamId) {
        try {
          console.log('AudioStreamingService - Received ICE candidate');
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('AudioStreamingService - Error adding ICE candidate:', error);
        }
      }
    });
    
    // Request connection to broadcaster
    console.log('AudioStreamingService - Requesting connection to broadcaster for stream:', streamId);
    
    // Store a random listener ID
    const listenerId = Math.random().toString(36).substring(2, 10);
    
    // Emit join-stream-request event to server
    socket.emit('join-stream-request', {
      streamId: streamId,
      listenerId: listenerId
    });
    
    // Listen for offers from broadcaster
    socket.on('offer', async (data: { listenerId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.listenerId === listenerId) {
        console.log('AudioStreamingService - Received offer from broadcaster');
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          console.log('AudioStreamingService - Sending answer to broadcaster');
          socket.emit('answer', {
            streamId: streamId,
            listenerId: listenerId,
            answer: answer
          });
        } catch (error) {
          console.error('AudioStreamingService - Error handling offer:', error);
        }
      }
    });
    
    // Return the media stream
    return new Promise((resolve, reject) => {
      // Set timeout for connection (increased from 15s to 30s)
      const timeout = setTimeout(() => {
        const errorMessage = this.hasSignalingServerError
          ? 'Connection timeout: Signaling server unavailable. Please make sure the signaling server is running at http://localhost:3000.'
          : 'Connection timeout: WebRTC connection could not be established. Please try again.';
        reject(new Error(errorMessage));
      }, 30000);
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          console.log('AudioStreamingService - Connection established');
          clearTimeout(timeout);
          resolve(resultStream);
        } else if (peerConnection.connectionState === 'failed' ||
                   peerConnection.connectionState === 'disconnected' ||
                   peerConnection.connectionState === 'closed') {
          console.error('AudioStreamingService - Connection failed:', peerConnection.connectionState);
          clearTimeout(timeout);
          
          const errorMessage = this.hasSignalingServerError 
            ? 'Failed to load content: Signaling server unavailable. Please make sure the signaling server is running at http://localhost:3000.'
            : 'Failed to load content';
          reject(new Error(errorMessage));
        }
      };
    });
  }
  
  initializeSocket(): void {
    console.log('AudioStreamingService - Initializing socket connection');
    try {
      const serverUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3000';
      console.log(`AudioStreamingService - Attempting to connect to signaling server at: ${serverUrl}`);
      
      this.socket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });
      
      // Handle socket connection events
      this.socket.on('connect', () => {
        console.log('AudioStreamingService - Socket connected successfully');
        this.hasSignalingServerError = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('AudioStreamingService - Socket connection error:', error);
        this.hasSignalingServerError = true;
        this.events.emit('error', `Signaling server connection failed. Make sure the server is running at ${serverUrl}`);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('AudioStreamingService - Socket disconnected:', reason);
      });
      
      // Broadcaster events
      this.socket.on('connection-request', (data: { userId: string; userName: string; userEmail: string }) => {
        console.log('AudioStreamingService - Received connection request from:', data.userName);
        this.events.emit('pending-listener', data);
      });
      
      // Handle join-stream requests for listeners
      this.socket.on('join-stream-request', (data: { listenerId: string; streamId: string }) => {
        console.log('AudioStreamingService - Received join stream request for stream:', data.streamId);
        if (data.streamId === this.streamId) {
          // Send offer to the listener
          this.sendOfferToListener(data.listenerId);
        }
      });
      
      this.socket.on('ice-candidate', async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
        if (this.peerConnections[data.userId]) {
          try {
            console.log('AudioStreamingService - Received ICE candidate from broadcaster');
            await this.peerConnections[data.userId].addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      });
      
      this.socket.on('answer', async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
        if (this.peerConnections[data.userId]) {
          try {
            console.log('AudioStreamingService - Received answer from listener');
            await this.peerConnections[data.userId].setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          } catch (e) {
            console.error('Error setting remote description:', e);
          }
        }
      });
    } catch (error) {
      console.error('AudioStreamingService - Error initializing socket:', error);
      this.hasSignalingServerError = true;
    }
  }
  
  // Helper method to initiate connection with a listener
  private async sendOfferToListener(listenerId: string): Promise<void> {
    if (!this.mediaStream) {
      console.error('AudioStreamingService - No media stream available to share');
      return;
    }
    
    try {
      console.log('AudioStreamingService - Creating peer connection for listener:', listenerId);
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10
      });
      
      this.peerConnections[listenerId] = peerConnection;
      
      // Clone the tracks to avoid affecting the original stream
      this.mediaStream.getTracks().forEach(track => {
        console.log('AudioStreamingService - Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track.clone(), this.mediaStream!);
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit('ice-candidate', {
            listenerId: listenerId,
            candidate: event.candidate
          });
        }
      };
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (this.socket) {
        this.socket.emit('offer', {
          listenerId: listenerId,
          offer: offer
        });
      }
    } catch (error) {
      console.error('AudioStreamingService - Error creating offer for listener:', error);
    }
  }
  
  private generateStreamId(): string {
    this.streamId = Math.random().toString(36).substring(2, 10);
    return this.streamId;
  }
  
  async startStream(mediaStream: MediaStream): Promise<string> {
    if (!this.socket) {
      this.initializeSocket();
    }
    
    // Store the media stream for later use with listeners
    this.mediaStream = mediaStream;
    
    const streamId = this.generateStreamId();
    console.log('AudioStreamingService - Generated stream ID:', streamId);
    
    try {
      console.log('AudioStreamingService - Registering stream with socket server');
      if (this.socket) {
        this.socket.emit('register-stream', { streamId });
        console.log('AudioStreamingService - Stream registered successfully');
      } else {
        console.error('AudioStreamingService - Socket not initialized');
        throw new Error('Socket not initialized');
      }
    } catch (error) {
      console.error('AudioStreamingService - Error registering stream:', error);
      throw error;
    }
    
    // Return just the streamId, not the full URL
    return streamId;
  }
  
  async approveListener(userId: string, mediaStream: MediaStream): Promise<boolean> {
    try {
      console.log('AudioStreamingService - Approving listener:', userId);
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10
      });
      
      this.peerConnections[userId] = peerConnection;
      
      // Clone the tracks to avoid affecting the original stream
      mediaStream.getTracks().forEach(track => {
        console.log('AudioStreamingService - Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track.clone(), mediaStream);
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit('ice-candidate', {
            userId: userId,
            candidate: event.candidate
          });
        }
      };
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (this.socket) {
        this.socket.emit('send-offer', {
          userId: userId,
          offer: offer
        });
      }
      
      this.events.emit('listener-approved', { id: userId });
      
      return true;
    } catch (error) {
      console.error('Error approving listener:', error);
      return false;
    }
  }
  
  removeListener(userId: string): void {
    if (this.peerConnections[userId]) {
      this.peerConnections[userId].close();
      delete this.peerConnections[userId];
      
      if (this.socket) {
        this.socket.emit('remove-listener', { userId });
      }
      this.events.emit('listener-removed', { id: userId });
    }
  }
  
  stopStream(): void {
    Object.keys(this.peerConnections).forEach(userId => {
      this.peerConnections[userId].close();
    });
    
    this.peerConnections = {};
    
    if (this.socket && this.streamId) {
      this.socket.emit('end-stream', { streamId: this.streamId });
    }
    
    this.streamId = null;
  }

  onPendingListener(callback: (data: { userId: string; userName: string; userEmail: string }) => void): void {
    this.events.on('pending-listener', callback);
  }

  onListenerApproved(callback: (data: { id: string }) => void): void {
    this.events.on('listener-approved', callback);
  }

  onListenerRemoved(callback: (data: { id: string }) => void): void {
    this.events.on('listener-removed', callback);
  }
  
  // Add disconnect method to clean up resources for listeners
  disconnect(): void {
    console.log('AudioStreamingService - Disconnecting from stream');
    
    // Close all peer connections
    Object.keys(this.peerConnections).forEach(userId => {
      this.peerConnections[userId].close();
    });
    
    this.peerConnections = {};
    
    // Remove all socket listeners by disconnecting and reinitializing
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.streamId = null;
    this.mediaStream = null;
  }
  
  // Add method to get error notifications
  onError(callback: (error: string) => void): void {
    this.events.on('error', callback);
  }
}

export const audioStreaming = new AudioStreamingService();