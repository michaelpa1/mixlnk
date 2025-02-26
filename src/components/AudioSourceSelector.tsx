import React, { useState, useEffect } from 'react';
import { Mic2, Radio, Settings2, AlertCircle } from 'lucide-react';
import type { AudioDevice, StreamingPreferences } from '../types';
import { AudioLevelMeter } from './AudioLevelMeter';
import { SettingsPanel } from './SettingsPanel';
import { audioCapture } from '../services/AudioCapture';

interface AudioSourceSelectorProps {
  onSourceSelect: (deviceId: string) => void;
}

export function AudioSourceSelector({ onSourceSelect }: AudioSourceSelectorProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [preferences, setPreferences] = useState<StreamingPreferences>({
    audioQuality: 'high',
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    stereoMode: true
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setError(null);
        
        const initialized = await audioCapture.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize audio system');
        }

        if (!mounted) return;

        const audioDevices = await audioCapture.getDevices();
        if (audioDevices.length === 0) {
          throw new Error('No audio input devices found');
        }

        if (!mounted) return;

        setDevices(audioDevices.map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Input ${device.deviceId.slice(0, 4)}`
        })));
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    audioCapture.onError((errorMessage) => {
      if (mounted) {
        setError(errorMessage);
        setMediaStream(null);
      }
    });

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    try {
      setError(null);
      setSelectedDevice(deviceId);
      
      const stream = await audioCapture.startCapturing(deviceId);
      if (stream) {
        setMediaStream(stream);
        onSourceSelect(deviceId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audio capture');
      setMediaStream(null);
    }
  };

  if (isInitializing) {
    return (
      <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-indigo-500" />
          <h2 className="text-xl font-semibold text-white">Audio Source</h2>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Open Settings"
        >
          <Settings2 className="w-5 h-5 text-white/60" />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {devices.length > 0 ? (
        <div className="space-y-4">
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white/80"
          >
            <option value="">Select an audio source...</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          
          {selectedDevice && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/60">Input Level</span>
                <div className="flex items-center gap-2">
                  <Mic2 className={`h-4 w-4 ${mediaStream ? 'text-indigo-500' : 'text-white/20'}`} />
                </div>
              </div>
              <AudioLevelMeter mediaStream={mediaStream} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Mic2 className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">
            No audio devices found. Please connect a microphone and refresh the page.
          </p>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          preferences={preferences}
          onPreferencesChange={setPreferences}
        />
      )}
    </div>
  );
}