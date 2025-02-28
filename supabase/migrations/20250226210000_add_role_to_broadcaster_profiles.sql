-- Add role column to broadcaster_profiles
ALTER TABLE broadcaster_profiles
ADD COLUMN role VARCHAR(50) DEFAULT 'user' NOT NULL;

-- Create an index on the role column for better performance
CREATE INDEX idx_broadcaster_profiles_role ON broadcaster_profiles(role);

-- Set initial admin user (you may want to replace with a specific user_id)
UPDATE broadcaster_profiles
SET role = 'admin'
WHERE id IN (SELECT id FROM broadcaster_profiles LIMIT 1);

-- Comment: This migration adds the missing 'role' column needed for the 
-- "Admins can approve files" policy in the audio_files table.