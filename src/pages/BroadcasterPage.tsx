import React, { useState } from 'react';
import { AudioSourceSelector } from '../components/AudioSourceSelector';
import { StreamControls } from '../components/StreamControls';
import { ListenerManagement } from '../components/ListenerManagement';
import { AudioFileUpload } from '../components/AudioFileUpload';
import { useAudioShare } from '../hooks/useAudioShare';
import { Radio, FileAudio } from 'lucide-react';

export function BroadcasterPage() {
  const [mode, setMode] = useState<'live' | 'upload'>('live');
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
    if (!streamId) return undefined; // Changed from null to undefined to fix type error
    
    // Check if streamId is already a full URL
    if (streamId.startsWith('http://') || streamId.startsWith('https://')) {
      return streamId; // Already a URL, just return it
    }
    
    // Otherwise, construct the URL
    return new URL(`/stream/${streamId}`, window.location.origin).toString();
  };

  const handleUploadComplete = (result: { shareId: string; title: string }) => {
    // Show success message or navigate to the file
    console.log(`File "${result.title}" uploaded successfully!`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Broadcast Studio</h1>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-4 mb-4 bg-gray-800 p-1 rounded-lg inline-block">
          <button
            onClick={() => setMode('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              mode === 'live' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Live Stream</span>
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <FileAudio className="h-4 w-4" />
            <span>Upload File</span>
          </button>
        </div>
        
        {/* Status indicator (only for live mode) */}
        {mode === 'live' && (
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
        )}
      </div>

      {mode === 'live' ? (
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
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Upload Audio File</h2>
            <p className="text-white/60">
              Share pre-recorded audio with your audience. Supported formats: MP3, WAV, M4A.
            </p>
          </div>
          
          <AudioFileUpload onUploadComplete={handleUploadComplete} />
          
          <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-2">About Audio File Uploads</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Uploaded audio files will be available in your "Files" tab</li>
              <li>You can share a permanent link to your audio with listeners</li>
              <li>Listeners can add comments at specific timestamps</li>
              <li>Files require approval before they're publicly accessible</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}