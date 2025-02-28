# Mixlnk Audio Files Enhancement Plan

After analyzing the current application structure and functionality, I've developed a comprehensive plan to enhance the Mixlnk app with audio file upload and feedback features. This enhancement will allow users to share pre-recorded audio files alongside the existing real-time streaming functionality.

## 1. Understanding the Current Architecture

The Mixlnk application currently has the following key components:

- **Frontend**: React/TypeScript with Vite, using TailwindCSS for styling
- **Backend**: Supabase for authentication, database, and storage
- **Real-time Communication**: WebRTC with Socket.io for live audio streaming
- **Authentication**: Using Supabase Auth
- **Styling**: TailwindCSS

The application already has AWS credentials configured in the `.env` file that we can use for S3 integration.

## 2. Architectural Changes Overview

To implement the requested audio file upload and feedback features, we need to make the following architectural changes:

### 2.1 New Backend Services

1. **S3Service**: Create a new service that handles file uploads, presigned URLs, and file retrieval using AWS SDK.
2. **Database Tables**: Add two new tables to Supabase for audio files and timeline-based comments.

### 2.2 New Frontend Components

1. **AudioFileUpload**: Component for uploading audio files with metadata
2. **AudioFilePlayer**: Component for playing uploaded files with timeline-based commenting
3. **Files Tab**: New tab in the dashboard for managing uploaded files

### 2.3 Updated UI Flows

1. **Toggle Mode**: Add a toggle on the broadcast page to switch between "Live Stream" and "Upload File" modes
2. **Listener Page**: Update to detect content type and display appropriate controls
3. **Comment Interface**: Add timeline-based comment interface for uploaded files

## 3. Implementation Plan

### 3.1 Backend Implementation

#### 3.1.1 AWS S3 Integration

1. **Create S3Service**: 
   - Create a new service at `src/services/S3Service.ts`
   - Implement file upload functionality using AWS SDK
   - Create methods for generating presigned URLs for file access
   - Configure it to use the existing AWS credentials in the environment variables

2. **Supabase Database Schema**:
   - Create a migration for two new tables:
     - `audio_files` - For storing metadata about uploaded audio files
     - `audio_comments` - For storing timeline-based comments on audio files

#### 3.1.2 Data Models

Define TypeScript interfaces for the new models:
- `AudioFile` - Representing uploaded audio files
- `AudioComment` - Representing timeline-based comments

### 3.2 Frontend Implementation

#### 3.2.1 New Components

1. **AudioFileUpload Component**:
   - File selection interface
   - Upload progress indicator
   - Metadata input fields (title, description)
   - Success/error handling

2. **AudioFilePlayer Component**:
   - Custom audio player with timeline
   - Comment display at appropriate timestamps
   - Comment creation interface
   - Playback controls

3. **Files Tab in Dashboard**:
   - List view of uploaded files
   - Actions: play, edit, delete
   - Filtering and sorting options

#### 3.2.2 Updated Components

1. **BroadcasterPage**:
   - Add toggle between "Live Stream" and "Upload File" modes
   - Show appropriate component based on selected mode

2. **ListenerPage**:
   - Detect if content is live stream or audio file
   - Show appropriate player based on content type
   - Add comment interface for audio files

3. **DashboardLayout**:
   - Add "Files" tab to navigation

### 3.3 Integration and Routing

1. **Update App Routes**:
   - Add routes for file management
   - Update ListenerPage to handle both stream and file content types

2. **Create New Hooks**:
   - `useAudioFiles` - For managing uploaded files
   - `useAudioComments` - For managing file comments

## 4. Detailed Implementation Steps

### Step 1: Create S3Service

Create a new service at `src/services/S3Service.ts` using AWS SDK to handle:
- File uploads with presigned URLs
- File retrieval
- File deletion

```typescript
// Example S3Service structure
export class S3Service {
  async uploadFile(file: File, metadata: AudioFileMetadata): Promise<string>;
  async getFileUrl(s3Key: string): Promise<string>;
  async deleteFile(s3Key: string): Promise<void>;
}
```

### Step 2: Create Database Tables

Create Supabase migration for:

```sql
-- audio_files table
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

-- audio_comments table
CREATE TABLE audio_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES audio_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  timestamp FLOAT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_share_id ON audio_files(share_id);
CREATE INDEX idx_audio_comments_file_id ON audio_comments(file_id);
CREATE INDEX idx_audio_comments_timestamp ON audio_comments(timestamp);
```

### Step 3: Update Type Definitions

Extend `src/types.ts` with:

```typescript
export interface AudioFile {
  id: string;
  userId: string;
  title: string;
  description?: string;
  s3Key: string;
  requiresApproval: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  shareId: string;
  createdAt: string;
}

export interface AudioComment {
  id: string;
  fileId: string;
  userId: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface AudioFileMetadata {
  title: string;
  description?: string;
  requiresApproval?: boolean;
}
```

### Step 4: Create Custom Hooks

Create new hooks for managing audio files and comments:

1. `src/hooks/useAudioFiles.ts`
2. `src/hooks/useAudioComments.ts`

### Step 5: Create New Components

1. **AudioFileUpload Component** (`src/components/AudioFileUpload.tsx`)
2. **AudioFilePlayer Component** (`src/components/AudioFilePlayer.tsx`)
3. **FilesPage** (`src/pages/FilesPage.tsx`)

### Step 6: Update Existing Components

1. **DashboardLayout** - Add "Files" tab to navigation
2. **BroadcasterPage** - Add toggle between modes
3. **ListenerPage** - Update to handle both content types
4. **App.tsx** - Add new routes

### Step 7: Install Dependencies

Add AWS SDK packages:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 5. Implementation Sequence

Here's the recommended implementation sequence:

1. **Backend First**:
   - Set up S3Service
   - Create database tables
   - Update type definitions

2. **Core Components**:
   - Build AudioFileUpload component
   - Build AudioFilePlayer component
   - Create custom hooks

3. **UI Integration**:
   - Update DashboardLayout to add Files tab
   - Create FilesPage
   - Update BroadcasterPage with toggle
   - Update ListenerPage for dual content support

4. **Testing and Refinement**:
   - Test all flows
   - Fix issues and refine UI

## 6. Technical Considerations

### Security
- Use presigned URLs for S3 access to prevent direct public access
- Implement proper access controls in Supabase RLS policies
- Validate file types and sizes on upload

### Performance
- Optimize audio files for streaming
- Use pagination for comments and file listings
- Consider caching strategies for frequently accessed files

### User Experience
- Provide clear feedback during upload process
- Ensure intuitive UI for switching between modes
- Make the commenting interface easy to use

## 7. Advantages of This Implementation

1. **Separation of Concerns**: Clear distinction between live streaming and file upload functionality
2. **Reusability**: Components are designed to be reusable and modular
3. **Scalability**: Architecture supports future expansion of features
4. **User Experience**: Seamless integration with existing functionality
5. **Performance**: Optimized for efficient file handling

## Next Steps

Upon approval of this plan, we can begin implementation, starting with the S3Service and database migration for the new tables.