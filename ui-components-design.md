# UI Components for Audio File Features

This document outlines the key UI components needed to implement the audio file upload, playback, and commenting features for the Mixlnk application.

## 1. Dashboard Navigation Enhancement

First, we need to update the `DashboardLayout.tsx` component to add a "Files" tab to the navigation.

```tsx
// In src/components/DashboardLayout.tsx
// Add this to the NavItem list:
<NavItem
  to="/dashboard/files"
  icon={<FileAudio className="h-5 w-5" />}
  label="Files"
  isActive={isActivePath('/dashboard/files')}
/>
```

## 2. AudioFileUpload Component

Create a new component that allows users to upload audio files with metadata.

**File Location**: `src/components/AudioFileUpload.tsx`

**Features**:
- File selection via drag-and-drop or file browser
- File type validation (audio only)
- File size limit enforcement
- Upload progress indication
- Metadata input form (title, description)
- Upload status and error handling

**Component Design**:

```tsx
interface AudioFileUploadProps {
  onUploadComplete: (fileData: { shareId: string; title: string }) => void;
  onUploadError: (error: Error) => void;
}

export function AudioFileUpload({ onUploadComplete, onUploadError }: AudioFileUploadProps) {
  // State for file, metadata, upload progress, and errors
  
  // Features:
  // 1. File selection area (dropzone)
  // 2. File preview with waveform visualization
  // 3. Metadata form (title, description)
  // 4. Upload button
  // 5. Progress indicator
  // 6. Success/error messaging
}
```

**Mockup**:
```
┌─────────────────────────────────────────────────┐
│ Upload Audio File                               │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │  Drag and drop your audio file here or      │ │
│ │  click to browse                            │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ File: example.mp3 (3.2 MB)                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 80%    │
│                                                 │
│ Title: [________________________]               │
│ Description:                                    │
│ [                                ]              │
│ [                                ]              │
│                                                 │
│ [Cancel]               [Upload Audio File]      │
└─────────────────────────────────────────────────┘
```

## 3. AudioFilePlayer Component

Create a component that plays audio files and enables timeline-based commenting.

**File Location**: `src/components/AudioFilePlayer.tsx`

**Features**:
- Audio playback with standard controls
- Waveform visualization
- Timeline display with comment markers
- Comment creation at specific timestamps
- Comment listing with timestamp navigation
- Comment sorting and filtering

**Component Design**:

```tsx
interface AudioFilePlayerProps {
  fileUrl: string;
  fileId: string;
  title: string;
  description?: string;
  comments?: AudioComment[];
  onAddComment?: (comment: { timestamp: number; text: string }) => Promise<void>;
}

export function AudioFilePlayer({
  fileUrl,
  fileId,
  title,
  description,
  comments = [],
  onAddComment
}: AudioFilePlayerProps) {
  // State for playback, current time, comments
  
  // Features:
  // 1. Audio player with controls
  // 2. Waveform visualization with timeline
  // 3. Comment markers on timeline
  // 4. Comment input form
  // 5. Comment list with timestamps
}
```

**Mockup**:
```
┌─────────────────────────────────────────────────┐
│ Title: Mixing Session - Pro Tools Mix           │
│ Description: Final mix of the new track         │
├─────────────────────────────────────────────────┤
│ ▶ 2:45 / 6:23                                  │
│                                                 │
│ ▁▂▃▅▆▆▂▁▁▁▂▃▄▅▆▇█▇▅▃▂▁▁▄▅▆▇█▇▅▃▂▁▁▁▂▃▄▅▆▇█▇▅▃▂ │
│     ↑         ↑           ↑                     │
│                                                 │
│ Add comment at current position:                │
│ [                                ]     [Add]    │
│                                                 │
│ Comments:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ 0:45 - John: The bass sounds great here!    │ │
│ │ 1:32 - Sarah: Can we boost the vocals?      │ │
│ │ 2:45 - Alex: Love the guitar solo           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 4. FilesPage Component

Create a new page to list and manage audio files.

**File Location**: `src/pages/FilesPage.tsx`

**Features**:
- List view of uploaded audio files
- Search and filter capabilities
- File metadata display
- Actions (play, share, edit, delete)
- Pagination for large file collections
- Upload button to start a new upload

**Component Design**:

```tsx
export function FilesPage() {
  // State for files, loading, search/filter
  
  // Features:
  // 1. Search and filter controls
  // 2. File listing with metadata
  // 3. File actions (play, share, edit, delete)
  // 4. Pagination controls
  // 5. Upload button
}
```

**Mockup**:
```
┌─────────────────────────────────────────────────┐
│ My Audio Files                    [Upload New]  │
├─────────────────────────────────────────────────┤
│ [Search files...]            Filter: [All ▼]    │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Mixing Session - Pro Tools Mix              │ │
│ │ February 26, 2025 · 6:23 · 12.4 MB          │ │
│ │                                             │ │
│ │ [Play] [Share] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Vocals Recording - Take 3                   │ │
│ │ February 25, 2025 · 4:12 · 8.7 MB           │ │
│ │                                             │ │
│ │ [Play] [Share] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Piano Practice - Beethoven                  │ │
│ │ February 20, 2025 · 12:45 · 24.1 MB         │ │
│ │                                             │ │
│ │ [Play] [Share] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Showing 1-3 of 12 files       < 1 2 3 4 >      │
└─────────────────────────────────────────────────┘
```

## 5. Updated BroadcasterPage Component

Modify the existing broadcaster page to include a toggle for switching between live streaming and file upload modes.

**File Location**: `src/pages/BroadcasterPage.tsx`

**Features**:
- Mode toggle between "Live Stream" and "Upload File"
- Conditional rendering of appropriate components based on mode
- Consistent UI between both modes

**Component Changes**:

```tsx
export function BroadcasterPage() {
  // Add state for mode
  const [mode, setMode] = useState<'live' | 'upload'>('live');
  
  // Keep existing streaming functionality
  
  // Add conditional rendering based on mode
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Broadcast Studio</h1>
        
        {/* Add mode toggle */}
        <div className="flex items-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${mode === 'live' ? 'bg-indigo-600' : 'bg-gray-700'}`}
            onClick={() => setMode('live')}
          >
            Live Stream
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${mode === 'upload' ? 'bg-indigo-600' : 'bg-gray-700'}`}
            onClick={() => setMode('upload')}
          >
            Upload File
          </button>
        </div>
        
        {/* Render appropriate content based on mode */}
        {mode === 'live' ? (
          <LiveStreamContent />
        ) : (
          <AudioFileUpload 
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        )}
      </div>
    </div>
  );
}
```

## 6. Updated ListenerPage Component

Modify the existing listener page to support both live streams and audio files.

**File Location**: `src/pages/ListenerPage.tsx`

**Features**:
- Content type detection (live stream or audio file)
- Conditional rendering based on content type
- Comment interface for audio files
- Consistent UI between both content types

**Component Changes**:

```tsx
export function ListenerPage() {
  // Add state for content type
  const [contentType, setContentType] = useState<'stream' | 'file' | null>(null);
  const [audioFile, setAudioFile] = useState(null);
  
  // Keep existing streaming functionality
  
  // Add detection logic in useEffect
  useEffect(() => {
    const detectContentType = async () => {
      // Detect if the ID is a stream ID or a file share ID
      // Set the appropriate content type and fetch data
    };
    
    detectContentType();
  }, [streamId]);
  
  // Render appropriate content based on type
  return (
    <div>
      {contentType === 'stream' ? (
        <LiveStreamContent />
      ) : contentType === 'file' ? (
        <AudioFilePlayer 
          fileUrl={audioFile.url}
          fileId={audioFile.id}
          title={audioFile.title}
          description={audioFile.description}
          comments={audioFile.comments}
          onAddComment={handleAddComment}
        />
      ) : (
        <LoadingContent />
      )}
    </div>
  );
}
```

## 7. Custom Hooks

### useAudioFiles Hook

Create a hook to manage audio file operations.

**File Location**: `src/hooks/useAudioFiles.ts`

```typescript
export function useAudioFiles() {
  // State for files, loading, errors
  
  // Functions:
  // - uploadFile
  // - getFiles
  // - getFileByShareId
  // - updateFile
  // - deleteFile
  
  return {
    // Expose state and functions
  };
}
```

### useAudioComments Hook

Create a hook to manage audio comments.

**File Location**: `src/hooks/useAudioComments.ts`

```typescript
export function useAudioComments(fileId: string) {
  // State for comments, loading, errors
  
  // Functions:
  // - getComments
  // - addComment
  // - updateComment
  // - deleteComment
  
  return {
    // Expose state and functions
  };
}
```

## 8. Routes Update

Update the application routes in `App.tsx` to include the new Files page.

```tsx
// In src/App.tsx
// Add the new route to the dashboard routes
<Route path="files" element={<FilesPage />} />
```

## Implementation Approach

1. Start by implementing the backend components:
   - S3Service implementation
   - Database migrations
   - Type definitions update

2. Then implement the core UI components:
   - Update DashboardLayout to add Files tab
   - Create FilesPage component
   - Create AudioFileUpload component
   - Create AudioFilePlayer component

3. Integrate the components with the backend:
   - Create custom hooks
   - Update BroadcasterPage
   - Update ListenerPage
   - Update routes

4. Test and refine the implementation

This implementation approach ensures that each component can be developed and tested independently, with clear integration points between them.