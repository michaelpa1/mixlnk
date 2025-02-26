import React from 'react';
import { Play, Square, Share2, Users, Copy, Radio } from 'lucide-react';
import type { StreamStatus } from '../types';

interface StreamControlsProps {
  status: StreamStatus;
  onStartStream: () => void;
  onStopStream: () => void;
  onShareLink: () => void;
}

export function StreamControls({ status, onStartStream, onStopStream, onShareLink }: StreamControlsProps) {
  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-indigo-500" />
          <h2 className="text-xl font-semibold">Stream Controls</h2>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
          <Users className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white/80">
            {status.activeListeners} Listener{status.activeListeners !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        {!status.isStreaming ? (
          <button
            onClick={onStartStream}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Stream
          </button>
        ) : (
          <button
            onClick={onStopStream}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop Stream
          </button>
        )}

        {status.shareableLink && (
          <button
            onClick={onShareLink}
            className="flex items-center justify-center gap-2 bg-white/5 text-white/80 py-3 px-6 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share Link
          </button>
        )}
      </div>

      {status.shareableLink && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/60 mb-1">Shareable Link</p>
              <code className="text-sm bg-white/5 p-2 rounded border border-white/10 block w-full overflow-x-auto text-white/80">
                {status.shareableLink}
              </code>
            </div>
            <button
              onClick={onShareLink}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}