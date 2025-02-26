import React from 'react';
import { AudioSourceSelector } from '../components/AudioSourceSelector';
import { StreamControls } from '../components/StreamControls';
import { ListenerManagement } from '../components/ListenerManagement';
import { useAudioShare } from '../hooks/useAudioShare';

export function BroadcasterPage() {
  const {
    isStreaming,
    shareableLink,
    selectedSource,
    listeners,
    setSelectedSource,
    startStream,
    stopStream,
    approveListener,
    removeListener
  } = useAudioShare();

  const getShareableUrl = (streamId: string | null) => {
    if (!streamId) return null;
    return new URL(`/stream/${streamId}`, window.location.origin).toString();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Broadcast Studio</h1>
        <div className="flex items-center gap-2 text-white/60">
          {isStreaming ? (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Now</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-white/20 rounded-full" />
              <span>Ready to Stream</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Audio Source and Controls */}
        <div className="space-y-8">
          <AudioSourceSelector onSourceSelect={setSelectedSource} />
          
          <StreamControls
            status={{
              isStreaming,
              shareableLink: getShareableUrl(shareableLink),
              activeListeners: listeners.filter(l => l.status === 'approved').length
            }}
            onStartStream={startStream}
            onStopStream={stopStream}
            onShareLink={() => {
              const url = getShareableUrl(shareableLink);
              if (url) {
                navigator.clipboard.writeText(url);
              }
            }}
          />
        </div>

        {/* Right Column - Listener Management */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Listeners</h2>
            <p className="text-white/60">Manage your audience in real-time</p>
          </div>

          <ListenerManagement
            listeners={listeners}
            onApprove={approveListener}
            onDeny={removeListener}
            onRemove={removeListener}
          />
        </div>
      </div>
    </div>
  );
}