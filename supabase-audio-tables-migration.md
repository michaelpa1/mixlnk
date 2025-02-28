# Supabase Migration for Audio Files Feature

This document contains the SQL migration script needed to add audio file and comment functionality to the Mixlnk application.

## Migration Script

Create the following file in your Supabase project's migrations directory (e.g., `supabase/migrations/20250227000000_audio_files_feature.sql`):

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audio Files Table
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  s3_key VARCHAR(255) NOT NULL,
  requires_approval BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  share_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Audio Comments Table
CREATE TABLE audio_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES audio_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  timestamp FLOAT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_share_id ON audio_files(share_id);
CREATE INDEX idx_audio_comments_file_id ON audio_comments(file_id);
CREATE INDEX idx_audio_comments_timestamp ON audio_comments(timestamp);

-- Row Level Security (RLS) Policies
-- Enable RLS on the tables
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_comments ENABLE ROW LEVEL SECURITY;

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
```

## Explanation of the Schema

### Audio Files Table

- `id`: Unique identifier for each audio file
- `user_id`: References the Supabase auth.users table to track who uploaded the file
- `title`: The title of the audio file
- `description`: Optional description of the file
- `s3_key`: The key used to store the file in S3
- `requires_approval`: Whether the file requires approval before being visible to others
- `approved`: Whether the file has been approved
- `approved_by`: The user ID of the admin who approved the file
- `approved_at`: When the file was approved
- `share_id`: A unique, user-friendly ID for sharing the file
- `created_at`: When the file was created

### Audio Comments Table

- `id`: Unique identifier for each comment
- `file_id`: References the audio_files table
- `user_id`: References the Supabase auth.users table to track who made the comment
- `timestamp`: The time position in the audio file where the comment applies
- `text`: The content of the comment
- `created_at`: When the comment was created

### Row Level Security (RLS)

The migration includes RLS policies to ensure proper access control:

1. Users can view their own files plus any approved files
2. Users can only insert, update, and delete their own files
3. Admins can approve files
4. Users can view and add comments on files they have access to
5. Users can only update and delete their own comments
6. File owners can delete any comments on their files

## How to Apply the Migration

1. Save the SQL script to a new file in your Supabase migrations directory with a timestamp name (e.g., `20250227000000_audio_files_feature.sql`)
2. Run the migration using the Supabase CLI:

```bash
supabase migration up
```

Or, if you're using the Supabase web interface:

1. Navigate to the SQL Editor
2. Paste the SQL script
3. Execute the script

## Type Definitions

After applying the migration, update your TypeScript type definitions in `src/types.ts`:

```typescript
export interface AudioFile {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  s3_key: string;
  requires_approval: boolean;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  share_id: string;
  created_at: string;
}

export interface AudioComment {
  id: string;
  file_id: string;
  user_id: string;
  timestamp: number;
  text: string;
  created_at: string;
}