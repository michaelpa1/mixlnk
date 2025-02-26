import React, { useState } from 'react';
import { Settings, X, Volume2, Mic2, Radio, Shield, Loader2 } from 'lucide-react';
import { useStreamingUsage } from '../hooks/useStreamingUsage';
import type { StreamingPreferences } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: StreamingPreferences;
  onPreferencesChange: (prefs: StreamingPreferences) => void;
}

export function SettingsPanel({ 
  isOpen, 
  onClose,
  preferences,
  onPreferencesChange 
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'preferences'>('account');
  const { usage, loading, error } = useStreamingUsage();

  if (!isOpen) return null;

  const handlePreferenceChange = (key: keyof StreamingPreferences, value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  const remainingTime = usage ? {
    minutes: usage.streamingLimits.monthlyMinutes - usage.streamingLimits.minutesUsed,
    hours: usage.streamingLimits.monthlyHours - usage.streamingLimits.hoursUsed
  } : { minutes: 0, hours: 0 };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">Stream Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'account'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Account & Usage
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stream Preferences
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {activeTab === 'account' ? (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              ) : usage ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 rounded-full p-3">
                        <Shield className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{usage.name}</h3>
                        <p className="text-sm text-slate-600">{usage.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} Plan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Monthly Usage</h3>
                    <div className="grid gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-600">Minutes Used</span>
                          <span className="text-sm text-slate-900">
                            {usage.streamingLimits.minutesUsed} / {usage.streamingLimits.monthlyMinutes}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ 
                              width: `${(usage.streamingLimits.minutesUsed / usage.streamingLimits.monthlyMinutes) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-600">Hours Used</span>
                          <span className="text-sm text-slate-900">
                            {usage.streamingLimits.hoursUsed} / {usage.streamingLimits.monthlyHours}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ 
                              width: `${(usage.streamingLimits.hoursUsed / usage.streamingLimits.monthlyHours) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-1">Remaining Time This Month</h4>
                    <p className="text-sm text-green-700">
                      {remainingTime.hours} hours and {remainingTime.minutes} minutes available
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-4">Audio Quality</h3>
                <select
                  value={preferences.audioQuality}
                  onChange={(e) => handlePreferenceChange('audioQuality', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="standard">Standard (128 kbps)</option>
                  <option value="high">High (256 kbps)</option>
                  <option value="ultra">Ultra (320 kbps)</option>
                </select>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-4">Audio Processing</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Echo Cancellation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.echoCancellation}
                      onChange={(e) => handlePreferenceChange('echoCancellation', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic2 className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Noise Suppression</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.noiseSuppression}
                      onChange={(e) => handlePreferenceChange('noiseSuppression', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Auto Gain Control</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoGainControl}
                      onChange={(e) => handlePreferenceChange('autoGainControl', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Stereo Mode</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.stereoMode}
                      onChange={(e) => handlePreferenceChange('stereoMode', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}