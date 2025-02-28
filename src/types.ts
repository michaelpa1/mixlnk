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

export interface AudioFile {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  s3_key: string;
  requires_approval: boolean;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  share_id: string;
  created_at: string;
}

export interface AudioComment {
  id: string;
  file_id: string;
  user_id: string;
  timestamp: number;
  text: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

export interface AudioFileUploadMetadata {
  title: string;
  description?: string;
  requiresApproval?: boolean;
}

export interface ContentType {
  type: 'stream' | 'file';
  id: string;
}

export interface BroadcasterProfile {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}