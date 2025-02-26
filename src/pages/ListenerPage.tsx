import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Share2, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { AudioLevelMeter } from '../components/AudioLevelMeter';
import { streamingService } from '../services/StreamingService';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ListenerPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [broadcasterInfo] = useState({
    name: 'MPA Creative',
    startDate: 'July 9, 2023',
    description: 'MPA Creative is the studio of Michael Pearson-Adams. He focuses on producing pop songs for Smurfs and Teletubbies mostly, but occasionally niches his talents to composing songs for the Wiggles.',
    currentTrack: 'Mixing Session - Pro Tools Mix of Teletubbie1',
    listeners: 56
  });

  useEffect(() => {
    let mounted = true;

    const connectToStream = async () => {
      if (!streamId) {
        setError('Invalid stream ID');
        setLoading(false);
        return;
      }

      try {
        const stream = await streamingService.connectToStream(streamId);
        if (mounted) {
          setMediaStream(stream);
          setIsPlaying(true);
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to stream';
        setError(errorMessage);
        setLoading(false);
        
        if (errorMessage.includes('Stream not found') || errorMessage.includes('Stream has ended')) {
          setTimeout(() => navigate('/'), 3000);
        }
      }
    };

    connectToStream();

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      streamingService.disconnect();
    };
  }, [streamId, navigate]);

  useEffect(() => {
    if (audioRef.current && mediaStream) {
      audioRef.current.srcObject = mediaStream;
      audioRef.current.play().catch(err => {
        setError('Failed to play audio: ' + err.message);
      });
    }
  }, [mediaStream]);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const copyStreamLink = () => {
    const streamUrl = window.location.href;
    navigator.clipboard.writeText(streamUrl);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-xl font-medium text-white mb-2">Connecting to stream...</p>
          <p className="text-white/60">Please wait while we establish a connection</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-white mb-2">{error}</p>
          <p className="text-white/60">
            {error.includes('Stream not found') || error.includes('Stream has ended')
              ? 'Redirecting to home page...'
              : 'Please try refreshing the page'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex justify-center items-center p-6">
      <div className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg flex flex-col">
        {/* Audio Meter */}
        <div className="w-full h-24 mb-4 p-4">
          <AudioLevelMeter mediaStream={mediaStream} />
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Section: Audio Player */}
          <div className="w-full lg:w-2/3 lg:pr-6 lg:border-r border-gray-700 p-6">
            {/* Stream Info */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <h2 className="text-2xl font-semibold">Live Stream</h2>
              <div>
                <span className="text-sm text-gray-400">
                  Listeners: <span className="text-white">{broadcasterInfo.listeners}</span>
                </span>
              </div>
            </div>

            {/* Audio Player */}
            <div className="mt-6 flex flex-col items-center relative">
              <button
                onClick={togglePlayPause}
                className="bg-gray-700 p-6 rounded-full hover:bg-gray-600 transition relative z-10"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10" />
                ) : (
                  <Play className="w-10 h-10" />
                )}
              </button>

              <div className="w-full mt-4 flex items-center gap-4">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
              <div className="mt-2 text-gray-400 text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-6 flex flex-col items-center">
              <h3 className="text-lg font-medium">Listen on Another Device</h3>
              <div className="bg-white p-2 rounded-lg mt-2">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                  alt="Stream QR Code"
                  className="w-32 h-32"
                />
              </div>
              <button
                onClick={copyStreamLink}
                className="mt-2 text-sm bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 transition flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Copy Stream Link
              </button>
            </div>

            {/* Stream Description */}
            <div className="mt-6 bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Now Playing</h3>
              <p className="text-sm text-gray-300 mt-2">{broadcasterInfo.currentTrack}</p>
            </div>
          </div>

          {/* Right Section: Profile Information */}
          <div className="w-full lg:w-1/3 lg:pl-6 p-6">
            <div className="bg-gray-700 p-6 rounded-lg h-full flex flex-col">
              <h3 className="text-2xl font-semibold">Broadcaster Profile</h3>
              <div className="mt-6 flex items-center">
                <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-500">
                  <img
                    src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80"
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-medium">{broadcasterInfo.name}</h4>
                  <p className="text-md text-gray-400">
                    Streaming Since: {broadcasterInfo.startDate}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-lg text-gray-300 flex-grow">
                {broadcasterInfo.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}