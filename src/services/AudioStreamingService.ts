import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter';

export class AudioStreamingService {
  private peerConnections: Record<string, RTCPeerConnection> = {};
  private streamId: string | null = null;
  private socket: Socket | null = null;
  private events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }
  
  initializeSocket(): void {
    this.socket = io(import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3000');
    
    this.socket.on('connection-request', (data: { userId: string; userName: string; userEmail: string }) => {
      this.events.emit('pending-listener', data);
    });
    
    this.socket.on('ice-candidate', async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (this.peerConnections[data.userId]) {
        try {
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
          await this.peerConnections[data.userId].setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      }
    });
  }
  
  private generateStreamId(): string {
    this.streamId = Math.random().toString(36).substring(2, 10);
    return this.streamId;
  }
  
  async startStream(mediaStream: MediaStream): Promise<string> {
    if (!this.socket) {
      this.initializeSocket();
    }
    
    const streamId = this.generateStreamId();
    
    this.socket!.emit('register-stream', { streamId });
    
    return `${window.location.origin}/stream/${streamId}`;
  }
  
  async approveListener(userId: string, mediaStream: MediaStream): Promise<boolean> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      this.peerConnections[userId] = peerConnection;
      
      mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, mediaStream);
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket!.emit('ice-candidate', {
            userId: userId,
            candidate: event.candidate
          });
        }
      };
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.socket!.emit('send-offer', {
        userId: userId,
        offer: offer
      });
      
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
      
      this.socket!.emit('remove-listener', { userId });
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
}

export const audioStreaming = new AudioStreamingService();