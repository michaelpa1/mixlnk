import { useState, useEffect, useCallback } from 'react';
import { audioCapture } from '../services/AudioCapture';
import { audioStreaming } from '../services/AudioStreamingService';
import type { Listener } from '../types';

export function useAudioShare() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [listeners, setListeners] = useState<Listener[]>([]);

  useEffect(() => {
    audioStreaming.onPendingListener((data) => {
      setListeners(prev => [...prev, {
        id: data.userId,
        name: data.userName,
        status: 'pending',
        joinedAt: new Date()
      }]);
    });

    audioStreaming.onListenerApproved((data) => {
      setListeners(prev => 
        prev.map(listener => 
          listener.id === data.id 
            ? { ...listener, status: 'approved' }
            : listener
        )
      );
    });

    audioStreaming.onListenerRemoved((data) => {
      setListeners(prev => prev.filter(listener => listener.id !== data.id));
    });

    audioCapture.onCaptureStopped(() => {
      setIsStreaming(false);
      setShareableLink(null);
    });
  }, []);

  const startStream = useCallback(async () => {
    const stream = await audioCapture.startCapturing(selectedSource);
    if (stream) {
      const link = await audioStreaming.startStream(stream);
      setShareableLink(link);
      setIsStreaming(true);
      return true;
    }
    return false;
  }, [selectedSource]);

  const stopStream = useCallback(() => {
    audioCapture.stopCapturing();
    audioStreaming.stopStream();
  }, []);

  const approveListener = useCallback(async (id: string) => {
    const stream = audioCapture.getStream();
    if (stream) {
      await audioStreaming.approveListener(id, stream);
    }
  }, []);

  const removeListener = useCallback((id: string) => {
    audioStreaming.removeListener(id);
  }, []);

  return {
    isStreaming,
    shareableLink,
    selectedSource,
    listeners,
    setSelectedSource,
    startStream,
    stopStream,
    approveListener,
    removeListener
  };
}