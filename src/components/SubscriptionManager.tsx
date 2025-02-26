import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Loader2, Shield, Crown, Zap } from 'lucide-react';

export function SubscriptionManager() {
  const { subscription, loading, error, subscribe, manageSubscription } = useSubscription();

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

  if (!subscription) return null;

  const tierIcons = {
    free: Shield,
    pro: Crown,
    enterprise: Zap
  };

  const TierIcon = tierIcons[subscription.tier];

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <TierIcon className="h-6 w-6 text-indigo-500" />
        <h2 className="text-xl font-semibold">Current Plan</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium capitalize">{subscription.tier} Plan</h3>
            <p className="text-white/60">
              {subscription.status === 'active' ? 'Active' : 'Inactive'}
            </p>
          </div>
          {subscription.currentPeriodEnd && (
            <div className="text-right">
              <p className="text-sm text-white/60">Renews on</p>
              <p className="font-medium">
                {subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {subscription.tier === 'free' ? (
          <div className="flex gap-4">
            <button
              onClick={() => subscribe('pro')}
              className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => subscribe('enterprise')}
              className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={manageSubscription}
              className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}