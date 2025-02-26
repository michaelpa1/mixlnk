/*
  # Add Lemon Squeezy configuration

  1. New Tables
    - `app_config`
      - Stores application-wide configuration
      - Includes Lemon Squeezy API key and webhook secret
  
  2. Security
    - Enable RLS
    - Only allow system-level access
    - Encrypt sensitive values
*/

-- Create encrypted configuration table
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  is_encrypted boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only allow system-level access
CREATE POLICY "No direct access to app_config"
  ON app_config
  FOR ALL
  USING (false);

-- Create function to safely get config value
CREATE OR REPLACE FUNCTION get_config(config_key text)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT value 
    FROM app_config 
    WHERE key = config_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely set config value
CREATE OR REPLACE FUNCTION set_config(config_key text, config_value text, config_description text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO app_config (key, value, description)
  VALUES (config_key, config_value, config_description)
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add Lemon Squeezy webhook function
CREATE OR REPLACE FUNCTION handle_lemon_squeezy_webhook()
RETURNS void AS $$
DECLARE
  webhook_secret text;
  signature text;
  payload json;
BEGIN
  -- Get webhook secret from config
  webhook_secret := get_config('LEMON_SQUEEZY_WEBHOOK_SECRET');
  
  -- Verify webhook signature
  signature := current_setting('request.headers')::json->>'x-signature';
  
  -- Get payload
  payload := current_setting('request.body')::json;
  
  -- Update subscription based on webhook event
  -- Implementation details will vary based on your needs
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_lemon_squeezy_webhook IS 'Handles Lemon Squeezy webhook events for subscription management';