import { EventEmitter } from '../utils/EventEmitter';

export class AudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isCapturing: boolean = false;
  private events: EventEmitter;
  private initialized: boolean = false;

  constructor() {
    this.events = new EventEmitter();
  }

  private async checkAudioSupport(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.events.emit('error', 'Your browser does not support audio capture');
      return false;
    }
    return true;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const hasSupport = await this.checkAudioSupport();
      if (!hasSupport) return false;

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request initial permissions to ensure we can access devices
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            this.events.emit('error', 'Please allow microphone access to use audio features');
          } else {
            this.events.emit('error', 'Failed to access audio device');
          }
        }
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioDevices = devices.some(device => device.kind === 'audioinput');
      
      if (!hasAudioDevices) {
        this.events.emit('error', 'No audio input devices detected');
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      if (error instanceof Error) {
        this.events.emit('error', `Audio initialization failed: ${error.message}`);
      }
      return false;
    }
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  async startCapturing(deviceId?: string): Promise<MediaStream | null> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return null;
    }

    try {
      // Stop any existing capture
      this.stopCapturing();

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } : true
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const analyzer = this.audioContext.createAnalyser();
      this.source.connect(analyzer);
      
      this.isCapturing = true;
      this.events.emit('capture-started');
      
      return this.mediaStream;
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotFoundError':
            this.events.emit('error', 'Audio device not found or has been disconnected');
            break;
          case 'NotAllowedError':
            this.events.emit('error', 'Microphone access denied');
            break;
          case 'NotReadableError':
            this.events.emit('error', 'Audio device is in use by another application');
            break;
          default:
            this.events.emit('error', error.message);
        }
      }
      
      return null;
    }
  }
  
  stopCapturing(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.isCapturing = false;
      this.events.emit('capture-stopped');
    }
  }
  
  getStream(): MediaStream | null {
    return this.mediaStream;
  }

  onCaptureStarted(callback: () => void): void {
    this.events.on('capture-started', callback);
  }

  onCaptureStopped(callback: () => void): void {
    this.events.on('capture-stopped', callback);
  }

  onError(callback: (error: string) => void): void {
    this.events.on('error', callback);
  }
}

export const audioCapture = new AudioCapture();