-- SQL script to create audio_files and audio_comments tables
-- Copy and paste this into the Supabase Dashboard SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if broadcaster_profiles table exists, create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'broadcaster_profiles'
    ) THEN
        CREATE TABLE broadcaster_profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            display_name VARCHAR(255),
            bio TEXT,
            avatar_url TEXT,
            role VARCHAR(50) DEFAULT 'user' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
        
        -- Create an index on the role column for better performance
        CREATE INDEX idx_broadcaster_profiles_role ON broadcaster_profiles(role);
        
        -- Enable RLS on the table
        ALTER TABLE broadcaster_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can view all broadcaster profiles
        CREATE POLICY "Users can view all broadcaster profiles"
        ON broadcaster_profiles
        FOR SELECT
        USING (true);
        
        -- Policy: Users can update their own profile
        CREATE POLICY "Users can update their own profile"
        ON broadcaster_profiles
        FOR UPDATE
        USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created broadcaster_profiles table';
    ELSE
        -- Check if role column exists, add it if it doesn't
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'broadcaster_profiles' AND column_name = 'role'
        ) THEN
            ALTER TABLE broadcaster_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user' NOT NULL;
            CREATE INDEX idx_broadcaster_profiles_role ON broadcaster_profiles(role);
            RAISE NOTICE 'Added role column to broadcaster_profiles table';
        END IF;
    END IF;
END $$;

-- Audio Files Table
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  s3_key VARCHAR(255) NOT NULL,
  requires_approval BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  share_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Audio Comments Table
CREATE TABLE IF NOT EXISTS audio_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL,
  user_id UUID NOT NULL,
  timestamp FLOAT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT fk_file FOREIGN KEY (file_id) REFERENCES audio_files(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_share_id ON audio_files(share_id);
CREATE INDEX IF NOT EXISTS idx_audio_comments_file_id ON audio_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_audio_comments_timestamp ON audio_comments(timestamp);

-- Row Level Security (RLS) Policies
-- Enable RLS on the tables
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own files and approved files" ON audio_files;
DROP POLICY IF EXISTS "Users can insert their own files" ON audio_files;
DROP POLICY IF EXISTS "Users can update their own files" ON audio_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON audio_files;
DROP POLICY IF EXISTS "Admins can approve files" ON audio_files;
DROP POLICY IF EXISTS "Users can view comments on files they can view" ON audio_comments;
DROP POLICY IF EXISTS "Users can insert comments on files they can view" ON audio_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON audio_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON audio_comments;
DROP POLICY IF EXISTS "File owners can delete comments on their files" ON audio_comments;

-- Policy: Users can view their own files plus any approved files
CREATE POLICY "Users can view their own files and approved files" 
ON audio_files 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (approved = true AND requires_approval = true) OR
  requires_approval = false
);

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert their own files" 
ON audio_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files" 
ON audio_files 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files" 
ON audio_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Admins can approve files
CREATE POLICY "Admins can approve files"
ON audio_files
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM broadcaster_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can view comments on files they can view
CREATE POLICY "Users can view comments on files they can view" 
ON audio_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM audio_files
    WHERE audio_files.id = audio_comments.file_id
    AND (
      audio_files.user_id = auth.uid() OR
      (audio_files.approved = true AND audio_files.requires_approval = true) OR
      audio_files.requires_approval = false
    )
  )
);

-- Policy: Users can insert comments on files they can view
CREATE POLICY "Users can insert comments on files they can view" 
ON audio_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM audio_files
    WHERE audio_files.id = file_id
    AND (
      audio_files.user_id = auth.uid() OR
      (audio_files.approved = true AND audio_files.requires_approval = true) OR
      audio_files.requires_approval = false
    )
  )
);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON audio_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON audio_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: File owners can delete any comments on their files
CREATE POLICY "File owners can delete comments on their files" 
ON audio_comments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM audio_files
    WHERE audio_files.id = file_id
    AND audio_files.user_id = auth.uid()
  )
);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audio_files', 'audio_comments')
ORDER BY table_name;