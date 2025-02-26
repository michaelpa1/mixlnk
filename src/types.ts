export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface Listener {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'denied';
  joinedAt: Date;
}

export interface StreamStatus {
  isStreaming: boolean;
  shareableLink?: string;
  activeListeners: number;
}

export interface UserAccount {
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  streamingLimits: {
    monthlyMinutes: number;
    monthlyHours: number;
    minutesUsed: number;
    hoursUsed: number;
  };
}

export interface StreamingPreferences {
  audioQuality: 'standard' | 'high' | 'ultra';
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  stereoMode: boolean;
}