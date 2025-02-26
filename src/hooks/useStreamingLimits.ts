import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StreamingLimits {
  weeklyMinutes: number;
  maxListeners: number;
  audioQuality: string;
  minutesUsed: number;
  minutesRemaining: number;
  canStream: boolean;
}

export function useStreamingLimits() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<StreamingLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLimits() {
      try {
        if (!user) return;

        // Get user's subscription and tier limits
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        const tier = subscription?.tier || 'free';

        const { data: tierLimits } = await supabase
          .from('streaming_limits')
          .select('*')
          .eq('tier', tier)
          .single();

        // Get current week's usage
        const currentWeek = new Date();
        currentWeek.setHours(0, 0, 0, 0);
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());

        const { data: usage } = await supabase
          .from('streaming_usage')
          .select('minutes_used')
          .eq('user_id', user.id)
          .eq('week_start', currentWeek.toISOString().split('T')[0])
          .single();

        const minutesUsed = usage?.minutes_used || 0;
        const weeklyMinutes = tierLimits.weekly_minutes;
        const minutesRemaining = weeklyMinutes === -1 ? -1 : Math.max(0, weeklyMinutes - minutesUsed);

        setLimits({
          weeklyMinutes,
          maxListeners: tierLimits.max_listeners,
          audioQuality: tierLimits.audio_quality,
          minutesUsed,
          minutesRemaining,
          canStream: weeklyMinutes === -1 || minutesUsed < weeklyMinutes
        });
      } catch (err) {
        console.error('Error loading streaming limits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load streaming limits');
      } finally {
        setLoading(false);
      }
    }

    loadLimits();
  }, [user]);

  return { limits, loading, error };
}