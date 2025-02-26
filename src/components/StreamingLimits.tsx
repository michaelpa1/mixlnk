import React from 'react';
import { useStreamingLimits } from '../hooks/useStreamingLimits';
import { Clock, Users, Music2, Loader2, AlertCircle } from 'lucide-react';

export function StreamingLimits() {
  const { limits, loading, error } = useStreamingLimits();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!limits) return null;

  const formatMinutes = (minutes: number): string => {
    if (minutes === -1) return 'Unlimited';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-6 w-6 text-indigo-500" />
        <h2 className="text-xl font-semibold">Streaming Limits</h2>
      </div>

      <div className="space-y-6">
        {/* Time Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60">Weekly Time Used</span>
            <span className="text-sm font-medium">
              {formatMinutes(limits.minutesUsed)} / {formatMinutes(limits.weeklyMinutes)}
            </span>
          </div>
          {limits.weeklyMinutes !== -1 && (
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (limits.minutesUsed / limits.weeklyMinutes) * 100)}%`
                }}
              />
            </div>
          )}
        </div>

        {/* Other Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Max Listeners</span>
            </div>
            <span className="text-lg font-medium">
              {limits.maxListeners === -1 ? 'Unlimited' : limits.maxListeners}
            </span>
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Music2 className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Audio Quality</span>
            </div>
            <span className="text-lg font-medium capitalize">
              {limits.audioQuality}
            </span>
          </div>
        </div>

        {/* Status */}
        {!limits.canStream && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Weekly streaming limit reached</span>
          </div>
        )}
      </div>
    </div>
  );
}