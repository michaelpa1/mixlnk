# Plan for Adding AudioReviewPage to Routes and Connecting to Real Data

Based on my analysis of the codebase, here's a detailed plan to add the AudioReviewPage to the application routes and update it to use real data sources.

## 1. Add Route to App.tsx

I'll add the new route for the AudioReviewPage component to the App.tsx file. The route should be added to the public routes section since it appears to be a page that allows external users to review shared audio files.

```tsx
<Route path="/review/:shareId" element={<AudioReviewPage />} />
```

This route will be added to the public routes section, alongside other public routes like the landing page and login page.

## 2. Update AudioReviewPage.tsx to Use Real Data Sources

The current AudioReviewPage component uses simulated data in its useEffect hook. I'll update it to use the real data sources available in the application:

### a. Import Required Hooks and Types
- Import the `useAudioFiles` hook to fetch the audio file by its share ID
- Import the `useAudioComments` hook to fetch and manage comments
- Import necessary types from the types.ts file

### b. Update the useEffect Hook
- Replace the simulated data fetching with real data fetching using the imported hooks
- Use the `getFileByShareId` function from `useAudioFiles` to fetch the audio file data
- Set the audio URL, title, and other metadata from the fetched file data

### c. Implement Comment Functionality
- Use the `useAudioComments` hook to fetch and display comments for the audio file
- Update the `addComment` function to use the hook's `addComment` function
- Implement the ability to delete comments if needed

### d. Handle Review Status Updates
- Implement functionality to update the review status of the audio file if needed

## Implementation Details

### App.tsx Changes

```tsx
// Add import for AudioReviewPage
import { AudioReviewPage } from './pages/AudioReviewPage';

// Add route in the public routes section
<Route path="review/:shareId" element={<AudioReviewPage />} />
```

### AudioReviewPage.tsx Changes

```tsx
// Add imports for hooks
import { useAudioFiles } from '../hooks/useAudioFiles';
import { useAudioComments } from '../hooks/useAudioComments';
import type { AudioFile, AudioComment } from '../types';

// Update component to use real data
export function AudioReviewPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  
  // Use the hooks
  const { getFileByShareId, loading: fileLoading } = useAudioFiles();
  const { 
    comments, 
    loading: commentsLoading, 
    addComment: saveComment, 
    deleteComment 
  } = useAudioComments(fileId || '');
  
  // Fetch the audio file data
  useEffect(() => {
    const fetchAudioData = async () => {
      try {
        setLoading(true);
        
        if (shareId) {
          const fileData = await getFileByShareId(shareId);
          setAudioFile(fileData);
          setFileId(fileData.id);
          setAudioUrl(fileData.url); // Assuming S3Service returns a URL
          setAudioTitle(fileData.title);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching audio data:', error);
        setLoading(false);
      }
    };

    fetchAudioData();
  }, [shareId, getFileByShareId]);
  
  // Update the addComment function
  const addComment = () => {
    if (!newComment.trim() || !fileId) return;
    
    const timestamp = isAddingTimelineComment ? currentTime : null;
    
    // Save the comment using the hook
    saveComment(timestamp, newComment)
      .then(() => {
        setNewComment('');
        setIsAddingTimelineComment(false);
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  };
  
  // Rest of the component remains largely the same
}
```

This implementation will ensure that the AudioReviewPage is properly integrated into the application and uses the real data sources available.