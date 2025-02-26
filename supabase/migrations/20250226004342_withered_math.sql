/*
  # Fix Broadcaster Profiles

  1. Changes
    - Create profiles for existing users who don't have one
    - Ensure all required columns have default values
    - Add missing RLS policies

  2. Security
    - Add RLS policy for inserting profiles
    - Ensure only authenticated users can create their own profile
*/

-- Add default values to required columns
ALTER TABLE broadcaster_profiles
ALTER COLUMN name SET DEFAULT '',
ALTER COLUMN name DROP NOT NULL;

-- Create profiles for existing users who don't have one
INSERT INTO broadcaster_profiles (user_id, name)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM broadcaster_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Add insert policy
CREATE POLICY "Users can create their own profile"
  ON broadcaster_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add delete policy
CREATE POLICY "Users can delete their own profile"
  ON broadcaster_profiles
  FOR DELETE
  USING (auth.uid() = user_id);