/*
  # Audio Streaming Schema

  1. New Tables
    - `streams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (enum: active, ended)
      - `started_at` (timestamp)
      - `ended_at` (timestamp, nullable)
      - `title` (text)
      - `settings` (jsonb)
    
    - `stream_connections`
      - `id` (uuid, primary key)
      - `stream_id` (uuid, references streams)
      - `user_id` (uuid, references auth.users)
      - `status` (enum: pending, connected, disconnected)
      - `connected_at` (timestamp)
      - `disconnected_at` (timestamp, nullable)
      - `offer` (jsonb)
      - `answer` (jsonb, nullable)

    - `stream_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month` (date)
      - `minutes_used` (integer)
      - `hours_used` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for stream management
    - Add policies for connection management
    - Add policies for usage tracking
*/

-- Create custom types
CREATE TYPE stream_status AS ENUM ('active', 'ended');
CREATE TYPE connection_status AS ENUM ('pending', 'connected', 'disconnected');

-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  status stream_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  title text NOT NULL DEFAULT '',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create stream_connections table
CREATE TABLE IF NOT EXISTS stream_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  offer jsonb,
  answer jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create stream_usage table
CREATE TABLE IF NOT EXISTS stream_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month date NOT NULL,
  minutes_used integer NOT NULL DEFAULT 0,
  hours_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_usage ENABLE ROW LEVEL SECURITY;

-- Streams policies
CREATE POLICY "Users can create their own streams"
  ON streams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own streams"
  ON streams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streams"
  ON streams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Stream connections policies
CREATE POLICY "Stream owners can view connections"
  ON stream_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streams
      WHERE streams.id = stream_id
      AND streams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create connections to streams"
  ON stream_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM streams
      WHERE streams.id = stream_id
      AND streams.status = 'active'
    )
  );

CREATE POLICY "Users can update their own connections"
  ON stream_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Stream usage policies
CREATE POLICY "Users can view their own usage"
  ON stream_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can update usage"
  ON stream_usage
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stream_connections_updated_at
  BEFORE UPDATE ON stream_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stream_usage_updated_at
  BEFORE UPDATE ON stream_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to update stream usage
CREATE OR REPLACE FUNCTION update_stream_usage()
RETURNS TRIGGER AS $$
DECLARE
  duration_minutes int;
  current_month date;
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'active' THEN
    -- Calculate duration in minutes
    duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - OLD.started_at)) / 60;
    current_month = date_trunc('month', NEW.ended_at)::date;
    
    -- Update or insert usage record
    INSERT INTO stream_usage (user_id, month, minutes_used, hours_used)
    VALUES (
      NEW.user_id,
      current_month,
      duration_minutes,
      duration_minutes / 60
    )
    ON CONFLICT (user_id, month)
    DO UPDATE SET
      minutes_used = stream_usage.minutes_used + duration_minutes,
      hours_used = (stream_usage.minutes_used + duration_minutes) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stream_usage_on_end
  AFTER UPDATE ON streams
  FOR EACH ROW
  EXECUTE FUNCTION update_stream_usage();