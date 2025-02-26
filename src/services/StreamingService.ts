import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from '../utils/EventEmitter';

export class StreamingService {
  private supabase;
  private events: EventEmitter;
  private currentStreamId: string | null = null;
  private listeners: Set<string> = new Set();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private mediaStream: MediaStream | null = null;
  private channels: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    this.events = new EventEmitter();
  }

  private async setupPeerConnection(connectionId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    });

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentStreamId) {
        await this.supabase.channel(`stream:${this.currentStreamId}:${connectionId}`)
          .send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: { candidate: event.candidate }
          });
      }
    };

    return peerConnection;
  }

  async startStream(mediaStream: MediaStream): Promise<string> {
    try {
      this.mediaStream = mediaStream;
      const streamId = crypto.randomUUID();
      this.currentStreamId = streamId;

      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('streams')
        .insert([{
          id: streamId,
          user_id: user.user.id,
          status: 'active',
          started_at: new Date().toISOString()
        }]);

      if (error) throw error;

      const channel = this.supabase.channel(`stream:${streamId}`)
        .on('broadcast', { event: 'connection_request' }, async ({ payload }) => {
          try {
            const { connectionId } = payload;
            await this.handleConnectionRequest(connectionId);
          } catch (err) {
            console.error('Error handling connection request:', err);
          }
        })
        .subscribe();

      this.channels.set('main', channel);
      return streamId;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async connectToStream(streamId: string): Promise<MediaStream> {
    if (!streamId) throw new Error('Stream ID is required');
    if (!this.isValidUUID(streamId)) throw new Error('Invalid stream ID format');

    try {
      const { data: stream, error } = await this.supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      if (!stream) throw new Error('Stream not found');
      if (stream.status !== 'active') throw new Error('Stream has ended');

      const connectionId = crypto.randomUUID();
      const peerConnection = await this.setupPeerConnection(connectionId);
      const mediaStream = new MediaStream();

      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          mediaStream.addTrack(track);
        });
      };

      await this.supabase.channel(`stream:${streamId}`)
        .send({
          type: 'broadcast',
          event: 'connection_request',
          payload: { connectionId }
        });

      const channel = this.supabase
        .channel(`stream:${streamId}:${connectionId}`)
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          try {
            const { offer } = payload;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await this.supabase
              .channel(`stream:${streamId}:${connectionId}:answer`)
              .send({
                type: 'broadcast',
                event: 'answer',
                payload: { answer }
              });
          } catch (err) {
            console.error('Error handling offer:', err);
            this.events.emit('error', 'Failed to establish connection');
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
          try {
            const { candidate } = payload;
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        })
        .subscribe();

      this.channels.set('main', channel);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
          peerConnection.close();
        }, 15000);

        peerConnection.onconnectionstatechange = () => {
          if (peerConnection.connectionState === 'connected') {
            clearTimeout(timeout);
            resolve(mediaStream);
          } else if (peerConnection.connectionState === 'failed') {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          }
        };
      });
    } catch (error) {
      console.error('Error connecting to stream:', error);
      throw error;
    }
  }

  private async handleConnectionRequest(connectionId: string) {
    if (!this.currentStreamId || !this.mediaStream) return;

    try {
      const peerConnection = await this.setupPeerConnection(connectionId);
      this.peerConnections.set(connectionId, peerConnection);

      this.mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      await this.supabase.channel(`stream:${this.currentStreamId}:${connectionId}`)
        .send({
          type: 'broadcast',
          event: 'offer',
          payload: { offer }
        });

      const answerChannel = this.supabase
        .channel(`stream:${this.currentStreamId}:${connectionId}:answer`)
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          try {
            const { answer } = payload;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error setting remote description:', err);
          }
        })
        .subscribe();

      this.channels.set(`answer:${connectionId}`, answerChannel);

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          this.listeners.add(connectionId);
          this.events.emit('listener-connected', { id: connectionId });
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
          this.removeListener(connectionId);
        }
      };
    } catch (err) {
      console.error('Error handling connection request:', err);
    }
  }

  async removeListener(connectionId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(connectionId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(connectionId);
    }

    const answerChannel = this.channels.get(`answer:${connectionId}`);
    if (answerChannel) {
      answerChannel.unsubscribe();
      this.channels.delete(`answer:${connectionId}`);
    }

    this.listeners.delete(connectionId);
    this.events.emit('listener-removed', { id: connectionId });
  }

  disconnect(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.peerConnections.forEach(connection => connection.close());
    this.peerConnections.clear();
    this.listeners.clear();
    this.currentStreamId = null;
    this.mediaStream = null;
  }

  async stopStream(): Promise<void> {
    try {
      if (!this.currentStreamId) return;

      await this.supabase
        .from('streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', this.currentStreamId);

      this.disconnect();
      this.events.emit('stream-end');
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }

  onStreamStart(callback: () => void): void {
    this.events.on('stream-start', callback);
  }

  onStreamEnd(callback: () => void): void {
    this.events.on('stream-end', callback);
  }

  onError(callback: (error: string) => void): void {
    this.events.on('error', callback);
  }

  onListenerConnected(callback: (data: { id: string }) => void): void {
    this.events.on('listener-connected', callback);
  }

  onListenerRemoved(callback: (data: { id: string }) => void): void {
    this.events.on('listener-removed', callback);
  }
}

export const streamingService = new StreamingService();