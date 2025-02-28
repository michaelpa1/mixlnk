-- Remove Stripe-related columns from subscriptions table
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_price_id;

-- Drop Stripe-related tables if they exist
DROP TABLE IF EXISTS stripe_customers;
DROP TABLE IF EXISTS stripe_products;
DROP TABLE IF EXISTS stripe_prices;

-- Ensure subscriptions table has essential fields
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'canceled', 'expired')),
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);