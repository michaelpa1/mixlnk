-- Set up subscription tiers and pricing

-- Update or insert streaming limits for each tier
INSERT INTO streaming_limits (tier, weekly_minutes, max_listeners, audio_quality)
VALUES
  ('free', 60, 5, 'standard'),
  ('pro', 1440, 100, 'high')
ON CONFLICT (tier) DO UPDATE SET
  weekly_minutes = EXCLUDED.weekly_minutes,
  max_listeners = EXCLUDED.max_listeners,
  audio_quality = EXCLUDED.audio_quality;

-- Create pricing table
CREATE TABLE IF NOT EXISTS subscription_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL REFERENCES streaming_limits(tier),
  price_usd numeric(10,2) NOT NULL,
  billing_interval text NOT NULL,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert pricing data
INSERT INTO subscription_prices (tier, price_usd, billing_interval, stripe_price_id)
VALUES
  ('free', 0, 'monthly', NULL),
  ('pro', 9.99, 'monthly', NULL);

-- Add RLS policies
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;

-- Allow read access to subscription prices for all authenticated users
CREATE POLICY "Allow read access to subscription prices"
  ON subscription_prices
  FOR SELECT
  TO authenticated
  USING (true);