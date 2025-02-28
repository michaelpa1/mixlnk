import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, MessageSquare,
  CheckCircle, XCircle, Clock, Download, Share2
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAudioFiles } from '../hooks/useAudioFiles';
import { useAudioComments } from '../hooks/useAudioComments';
import type { AudioFile, AudioComment } from '../types';

// Using AudioComment type from types.ts, but adding a local interface for backward compatibility
interface Comment extends AudioComment {
  userName?: string;
  createdAt?: Date;
}

type ReviewStatus = 'Approved' | 'Needs Review' | 'In Progress' | 'Delivered';

export function AudioReviewPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState('Audio Track');
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isAddingTimelineComment, setIsAddingTimelineComment] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('Needs Review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the hooks for audio files and comments
  const { getFileByShareId } = useAudioFiles();
  const {
    comments,
    loading: commentsLoading,
    addComment: saveComment
  } = useAudioComments(fileId || '');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  // Fetch audio data using real data sources
  useEffect(() => {
    const fetchAudioData = async () => {
      if (!shareId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the audio file data using the shareId
        const fileData = await getFileByShareId(shareId);
        
        if (fileData) {
          setAudioFile(fileData);
          setFileId(fileData.id);
          
          // Get the audio URL from S3 service
          setAudioUrl(fileData.url);
          setAudioTitle(fileData.title || 'Audio Track');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching audio data:', error);
        
        // Check if this is the "awaiting approval" error
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Debug - Error message:', errorMessage);
        
        // Make the check more flexible and case-insensitive
        const lowerCaseError = errorMessage.toLowerCase();
        if (lowerCaseError.includes('await') && lowerCaseError.includes('approval')) {
          setError('This file is awaiting approval by the owner and cannot be accessed yet.');
        } else {
          setError('Unable to load the audio file. It may have been removed or you do not have permission to access it.');
        }
        
        setLoading(false);
      }
    };

    fetchAudioData();
  }, [shareId, getFileByShareId]);

  // Toggle play/pause
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !audioRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time display (e.g., 3:45)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Add comment using the real API
  const addComment = () => {
    if (!newComment.trim() || !fileId) return;
    
    // Use the timestamp or 0 if it's a general comment
    const timestamp = isAddingTimelineComment ? currentTime : 0;
    
    // Save the comment using the hook's function
    saveComment(timestamp, newComment)
      .then(() => {
        setNewComment('');
        setIsAddingTimelineComment(false);
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  };

  // Jump to timestamp
  const jumpToTimestamp = (timestamp: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // If there's an error, display an error message
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10 max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-white/80">{error}</p>
          </div>
          <div className="flex justify-center">
            <Link
              to="/"
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading audio file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{audioTitle}</h1>
              <p className="text-white/60">Shared for your review</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Player */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 mb-6">
            {/* Waveform Visualization */}
            <div className="mb-4 h-32 bg-black/20 rounded-lg overflow-hidden relative">
              <canvas ref={waveformRef} className="w-full h-full" />
              
              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-indigo-500" 
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Comment Markers */}
              {comments
                .filter(c => c.timestamp !== null)
                .map(comment => (
                  <div
                    key={comment.id}
                    className="absolute bottom-0 w-4 h-4 bg-indigo-500 rounded-full cursor-pointer transform -translate-x-1/2"
                    style={{ left: `${((comment.timestamp || 0) / duration) * 100}%`, bottom: '10px' }}
                    title={`${comment.user?.name || 'User'}: ${comment.text}`}
                    onClick={() => jumpToTimestamp(comment.timestamp || 0)}
                  />
                ))}
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlayback}
                className="h-12 w-12 flex items-center justify-center bg-indigo-500 rounded-full hover:bg-indigo-600 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </button>
              
              <div className="flex-1">
                <div 
                  ref={timelineRef}
                  className="w-full bg-white/10 h-2 rounded-full cursor-pointer"
                  onClick={handleTimelineClick}
                >
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between mt-2 text-sm text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-32">
                <button onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-white/60" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white/60" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-white/10 rounded-full"
                />
              </div>
            </div>
          </div>
          
          {/* Comment Input */}
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Your Feedback</h2>
              <button
                onClick={() => setIsAddingTimelineComment(!isAddingTimelineComment)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                  isAddingTimelineComment 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>
                  {isAddingTimelineComment 
                    ? `Comment at ${formatTime(currentTime)}` 
                    : 'Add Timeline Comment'}
                </span>
              </button>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAddingTimelineComment 
                  ? `Add comment at ${formatTime(currentTime)}...` 
                  : "Add a general comment..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="bg-indigo-500 px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-indigo-500/50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
        
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      
      {/* Right Sidebar - Comments and Status */}
      <div className="w-96 border-l border-white/10 flex flex-col">
        {/* Status Section */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold mb-4">Review Status</h2>
          <select
            value={reviewStatus}
            onChange={(e) => {
              const newStatus = e.target.value as ReviewStatus;
              setReviewStatus(newStatus);
              
              // Update the review status in the database if we have a file ID
              if (fileId && audioFile) {
                // This is a simplified example - in a real app, you'd have a proper API call
                supabase
                  .from('audio_files')
                  .update({
                    review_status: newStatus,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', fileId)
                  .then(({ error }) => {
                    if (error) {
                      console.error('Error updating review status:', error);
                    }
                  });
              }
            }}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Approved">Approved</option>
            <option value="Needs Review">Needs Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
        
        {/* Comments Section */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Comments</h2>
            <span className="bg-white/10 px-2 py-1 rounded-full text-sm text-white/60">
              {comments.length}
            </span>
          </div>
          
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{comment.user?.name || 'User'}</h3>
                    {comment.timestamp !== null && (
                      <button
                        onClick={() => jumpToTimestamp(comment.timestamp || 0)}
                        className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full text-white/60 hover:bg-white/20 transition-colors"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTime(comment.timestamp || 0)}
                      </button>
                    )}
                  </div>
                  <p className="text-white/80">{comment.text}</p>
                  <p className="text-xs text-white/40 mt-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No comments yet</p>
              <p className="text-sm text-white/40 mt-1">Be the first to leave feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
