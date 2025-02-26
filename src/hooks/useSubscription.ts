import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'expired';
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
              stripeSubscriptionId: newSub.stripe_subscription_id
            });
          }
        } else if (fetchError) {
          throw fetchError;
        } else if (data && mounted) {
          setSubscription({
            tier: data.tier as SubscriptionTier,
            status: data.status,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
            stripeSubscriptionId: data.stripe_subscription_id
          });
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
        if (mounted) {
          setSubscription({
            tier: 'free',
            status: 'active',
            currentPeriodEnd: null,
            stripeSubscriptionId: null
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
    if (!user) throw new Error('User must be logged in to subscribe');

    try {
      // Create a Stripe Checkout Session
      const { data: { sessionId }, error } = await supabase
        .functions.invoke('create-checkout-session', {
          body: { tier, email: user.email }
        });

      if (error) throw error;

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Failed to load Stripe');

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw stripeError;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const manageSubscription = async () => {
    if (!user) throw new Error('User must be logged in');

    try {
      // Create a Stripe Customer Portal session
      const { data: { url }, error } = await supabase
        .functions.invoke('create-portal-session', {
          body: { email: user.email }
        });

      if (error) throw error;

      // Redirect to Customer Portal
      window.location.href = url;
    } catch (err) {
      console.error('Error creating portal session:', err);
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