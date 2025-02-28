import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'expired';
  currentPeriodEnd: Date | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      try {
        if (!user) {
          if (mounted) {
            setSubscription(null);
            setLoading(false);
          }
          return;
        }

        // First try to get existing subscription
        const { data, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no subscription exists, create a default one
        if (!data && !fetchError) {
          const { data: newSub, error: createError } = await supabase
            .from('subscriptions')
            .insert([{
              user_id: user.id,
              tier: 'free',
              status: 'active'
            }])
            .select()
            .single();

          if (createError) throw createError;
          if (mounted && newSub) {
            setSubscription({
              tier: newSub.tier as SubscriptionTier,
              status: newSub.status,
              currentPeriodEnd: newSub.current_period_end ? new Date(newSub.current_period_end) : null,
  
            });
          }
        } else if (fetchError) {
          throw fetchError;
        } else if (data && mounted) {
          setSubscription({
            tier: data.tier as SubscriptionTier,
            status: data.status,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,

          });
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
        if (mounted) {
          setSubscription({
            tier: 'free',
            status: 'active',
            currentPeriodEnd: null,

          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, [user]);

  const subscribe = async (tier: 'pro' | 'enterprise') => {
    if (!user) {
      setError('User must be logged in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          tier,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status,
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null
        });
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      throw err;
    }
  };

  const manageSubscription = async () => {
    if (!user) throw new Error('User must be logged in');

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          current_period_end: new Date() 
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status,
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null
        });
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    subscribe,
    manageSubscription
  };
}