/*
  # Add subscriptions and streaming limits

  1. New Tables
    - `subscriptions`
      - Tracks user subscription status and details
      - Stores Lemon Squeezy integration data
    - `streaming_limits`
      - Defines time limits for each subscription tier
    - `streaming_usage`
      - Tracks user's streaming time usage

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create subscription status type
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  lemon_squeezy_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create streaming limits table
CREATE TABLE IF NOT EXISTS streaming_limits (
  tier text PRIMARY KEY,
  weekly_minutes integer NOT NULL,
  max_listeners integer NOT NULL,
  audio_quality text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create streaming usage table
CREATE TABLE IF NOT EXISTS streaming_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  week_start date NOT NULL,
  minutes_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_usage ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Streaming limits policies
CREATE POLICY "Everyone can view streaming limits"
  ON streaming_limits
  FOR SELECT
  TO authenticated
  USING (true);

-- Streaming usage policies
CREATE POLICY "Users can view their own usage"
  ON streaming_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default streaming limits
INSERT INTO streaming_limits (tier, weekly_minutes, max_listeners, audio_quality) VALUES
  ('free', 30, 2, 'standard'),
  ('pro', 240, -1, 'high'),
  ('enterprise', -1, -1, 'ultra');

-- Create function to check streaming limits
CREATE OR REPLACE FUNCTION check_streaming_allowed(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_tier text;
  weekly_limit integer;
  minutes_used integer;
  current_week date;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM subscriptions
  WHERE subscriptions.user_id = check_streaming_allowed.user_id;

  -- Default to free tier if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Get weekly limit for user's tier
  SELECT weekly_minutes INTO weekly_limit
  FROM streaming_limits
  WHERE tier = user_tier;

  -- Enterprise tier has no limits
  IF weekly_limit = -1 THEN
    RETURN true;
  END IF;

  -- Get current week's usage
  current_week := date_trunc('week', now())::date;
  
  SELECT COALESCE(sum(minutes_used), 0) INTO minutes_used
  FROM streaming_usage
  WHERE streaming_usage.user_id = check_streaming_allowed.user_id
  AND week_start = current_week;

  -- Check if user has remaining time
  RETURN minutes_used < weekly_limit;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_streaming_limits_updated_at
  BEFORE UPDATE ON streaming_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_streaming_usage_updated_at
  BEFORE UPDATE ON streaming_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();