import React, { useState, useRef, useEffect } from 'react';
import { useAudioComments } from '../hooks/useAudioComments';
import { Play, Pause, Volume2, VolumeX, MessageSquare, Send, Trash2, User } from 'lucide-react';
import { AudioLevelMeter } from './AudioLevelMeter';
import type { AudioComment, AudioFile } from '../types';

interface AudioFilePlayerProps {
  fileUrl: string;
  fileId: string;
  title: string;
  description?: string;
  requiresApproval?: boolean;
  isApproved?: boolean;
  onAddComment?: (comment: { timestamp: number; text: string }) => Promise<void>;
}

export function AudioFilePlayer({
  fileUrl,
  fileId,
  title,
  description,
  requiresApproval = false,
  isApproved = true,
  onAddComment
}: AudioFilePlayerProps) {
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Comments state
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const { comments, loading: commentsLoading, addComment, deleteComment } = useAudioComments(fileId);

  // Set up audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      // Create an AudioContext to create a MediaStream from the audio element
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audioRef.current);
      const analyzer = audioCtx.createAnalyser();
      
      source.connect(analyzer);
      analyzer.connect(audioCtx.destination);
      
      // Create a MediaStream from the analyzer node (for visualization)
      // Since we can't easily create a MediaStream from the analyzer directly,
      // we'll use a workaround by creating an oscillator node
      const oscillator = audioCtx.createOscillator();
      const destination = audioCtx.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      
      // Use the MediaStream from the destination
      setMediaStream(destination.stream);
      
      return () => {
        audioCtx.close();
      };
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seeking in the audio
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !audioRef.current) return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time display (e.g., 3:45)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add a comment at the current time
  const handleAddComment = async () => {
    if (!commentText.trim() || !onAddComment) return;
    
    try {
      await addComment(currentTime, commentText);
      setCommentText('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Jump to a specific time in the audio
  const jumpToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      
      // Start playing if not already
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Generate visualization data points
  const generateVisualizationPoints = (numPoints = 100): number[] => {
    // This is a placeholder that generates a random waveform
    // In a real app, you'd analyze the audio file to get the actual waveform
    return Array.from({ length: numPoints }, () => Math.random() * 0.8 + 0.2);
  };

  const waveformPoints = generateVisualizationPoints();

  // Get comments that are close to the current time (within 2 seconds)
  const currentTimeComments = comments.filter(
    comment => Math.abs(comment.timestamp - currentTime) < 2
  );

  // Function to determine if a comment marker should be shown at a specific position
  const shouldShowMarker = (position: number): boolean => {
    const timeAtPosition = (position / 100) * duration;
    return comments.some(comment => Math.abs(comment.timestamp - timeAtPosition) < (duration / 100));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full">
      {/* Title and description */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && (
          <p className="text-gray-400 mt-1">{description}</p>
        )}
        
        {requiresApproval && !isApproved && (
          <div className="mt-2 px-3 py-1 bg-yellow-800/30 border border-yellow-700 text-yellow-200 rounded-md inline-block text-sm">
            Awaiting approval
          </div>
        )}
      </div>
      
      {/* Audio visualization and timeline */}
      <div className="mb-4">
        <AudioLevelMeter mediaStream={mediaStream} />
      </div>
      
      {/* Playback controls and timeline */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={togglePlayPause}
          className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </button>
        
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          <button onClick={toggleMute} className="p-1">
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-gray-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:w-4 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
        
        <button 
          onClick={() => setShowCommentInput(!showCommentInput)}
          className={`p-2 rounded-md transition ${
            showCommentInput ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>
      
      {/* Waveform with markers */}
      <div 
        ref={waveformRef}
        className="h-16 bg-gray-700 rounded-md mb-4 relative cursor-pointer"
        onClick={handleSeek}
      >
        {/* Waveform visualization */}
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {waveformPoints.map((point, index) => (
            <div
              key={index}
              className={`w-1 rounded-full transition-all duration-200 ${
                currentTime / duration > index / waveformPoints.length
                  ? 'bg-indigo-500'
                  : 'bg-gray-500'
              }`}
              style={{ height: `${point * 100}%` }}
            />
          ))}
        </div>
        
        {/* Comment markers */}
        {waveformPoints.map((_, index) => {
          const position = (index / waveformPoints.length) * 100;
          return shouldShowMarker(position) ? (
            <div
              key={`marker-${index}`}
              className="absolute w-3 h-3 bg-yellow-500 rounded-full transform -translate-y-1/2 z-10"
              style={{ 
                left: `${position}%`,
                top: '50%'
              }}
            />
          ) : null;
        })}
        
        {/* Playhead */}
        <div
          className="absolute w-px h-full bg-white z-20"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      {/* Comment input */}
      {showCommentInput && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment at current position..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Add
          </button>
        </div>
      )}
      
      {/* Current time comments */}
      {currentTimeComments.length > 0 && (
        <div className="mb-6 p-3 bg-gray-700/50 border border-gray-600 rounded-md animate-pulse">
          <h3 className="text-sm font-medium text-gray-300 mb-2">At this moment:</h3>
          <div className="space-y-2">
            {currentTimeComments.map(comment => (
              <div key={comment.id} className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-indigo-300">
                      {comment.user?.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All comments */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-medium mb-3">Comments</h3>
        
        {commentsLoading ? (
          <div className="text-center py-4 text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No comments yet</div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {comments.map(comment => (
              <div 
                key={comment.id} 
                className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-md hover:bg-gray-700/50 transition"
              >
                <div className="h-10 w-10 rounded-full bg-indigo-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-indigo-300">
                      {comment.user?.name || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => jumpToTime(comment.timestamp)}
                        className="text-xs bg-gray-600 px-2 py-1 rounded hover:bg-gray-500 transition"
                      >
                        {formatTime(comment.timestamp)}
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={fileUrl}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={e => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}