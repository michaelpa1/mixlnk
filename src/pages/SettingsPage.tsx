import React from 'react';
import { Settings2, Volume2, Radio, Shield } from 'lucide-react';
import { useStreamingUsage } from '../hooks/useStreamingUsage';
import { SubscriptionManager } from '../components/SubscriptionManager';
import { StreamingLimits } from '../components/StreamingLimits';

export function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">Manage your account and streaming preferences</p>
      </div>

      <div className="space-y-6">
        <SubscriptionManager />
        <StreamingLimits />

        {/* Audio Settings */}
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Volume2 className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-semibold">Audio Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Default Audio Quality
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
                <option value="standard">Standard (128 kbps)</option>
                <option value="high">High (256 kbps)</option>
                <option value="ultra">Ultra (320 kbps)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Echo Cancellation</span>
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Noise Suppression</span>
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Auto Gain Control</span>
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}