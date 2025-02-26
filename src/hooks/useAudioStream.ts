import { useState, useCallback } from 'react';
import { streamingService } from '../services/StreamingService';
import type { Listener } from '../types';

export function useAudioStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [listeners, setListeners] = useState<Listener[]>([]);

  const startStream = useCallback(async (mediaStream: MediaStream) => {
    try {
      const link = await streamingService.startStream(mediaStream);
      setShareableLink(link);
      setIsStreaming(true);
      return true;
    } catch (error) {
      console.error('Failed to start stream:', error);
      return false;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamingService.stopStream();
    setIsStreaming(false);
    setShareableLink(null);
    setListeners([]);
  }, []);

  const approveListener = useCallback(async (id: string, mediaStream: MediaStream) => {
    try {
      await streamingService.approveListener(id, mediaStream);
      setListeners(prev =>
        prev.map(listener =>
          listener.id === id
            ? { ...listener, status: 'approved' as const }
            : listener
        )
      );
    } catch (error) {
      console.error('Failed to approve listener:', error);
    }
  }, []);

  const removeListener = useCallback((id: string) => {
    streamingService.removeListener(id);
    setListeners(prev => prev.filter(listener => listener.id !== id));
  }, []);

  return {
    isStreaming,
    shareableLink,
    listeners,
    startStream,
    stopStream,
    approveListener,
    removeListener,
  };
}