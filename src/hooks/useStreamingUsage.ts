import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useStreamingUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Default values for Pro plan
        setUsage({
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          plan: 'pro',
          streamingLimits: {
            monthlyMinutes: 6000,
            monthlyHours: 100,
            minutesUsed: 0,
            hoursUsed: 0
          }
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError('Failed to fetch usage data. Please try again later.');
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  return { usage, loading, error };
}