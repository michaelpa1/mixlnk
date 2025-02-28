# S3Service Implementation

Below is the proposed implementation for the `S3Service.ts` file to handle audio file uploads and retrievals using AWS SDK. This service will handle file uploads, presigned URLs for secure access, and file deletion.

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '../lib/supabase';

export interface AudioFileMetadata {
  title: string;
  description?: string;
  requiresApproval?: boolean;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const region = import.meta.env.VITE_AWS_REGION;
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    this.bucketName = import.meta.env.VITE_S3_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error('AWS credentials or bucket name are not configured properly');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  /**
   * Generate a unique S3 key for storing a file
   * @param userId User ID who is uploading the file
   * @param fileName Original file name
   * @returns Unique S3 key
   */
  private generateS3Key(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    return `user_${userId}/${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  }

  /**
   * Generate a unique share ID for the audio file
   * @returns A unique share ID
   */
  private generateShareId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Upload an audio file to S3 and save metadata in Supabase
   * @param file File to upload
   * @param userId User ID of the uploader
   * @param metadata File metadata
   * @returns S3 key of the uploaded file
   */
  async uploadFile(file: File, userId: string, metadata: AudioFileMetadata): Promise<{ s3Key: string, shareId: string }> {
    try {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        throw new Error('Only audio files are allowed');
      }

      // Generate a unique S3 key and share ID
      const s3Key = this.generateS3Key(userId, file.name);
      const shareId = this.generateShareId();

      // Create a buffer from the file
      const fileBuffer = await file.arrayBuffer();

      // Upload the file to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.type,
        Metadata: {
          'x-amz-meta-user-id': userId,
          'x-amz-meta-original-name': file.name,
          'x-amz-meta-title': metadata.title,
          'x-amz-meta-description': metadata.description || ''
        }
      });

      await this.s3Client.send(command);

      // Save metadata to Supabase
      const { error } = await supabase.from('audio_files').insert({
        user_id: userId,
        title: metadata.title,
        description: metadata.description,
        s3_key: s3Key,
        requires_approval: metadata.requiresApproval ?? true,
        approved: false,
        share_id: shareId
      });

      if (error) {
        throw new Error(`Failed to save file metadata: ${error.message}`);
      }

      return { s3Key, shareId };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for accessing a file
   * @param s3Key S3 key of the file
   * @param expiresIn Expiration time in seconds (default: 3600)
   * @returns Presigned URL for accessing the file
   */
  async getFileUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param s3Key S3 key of the file
   * @returns File metadata
   */
  async getFileMetadata(s3Key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      const response = await this.s3Client.send(command);
      return response.Metadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3 and remove its metadata from Supabase
   * @param s3Key S3 key of the file
   * @param userId User ID for permission check
   * @returns True if successfully deleted
   */
  async deleteFile(s3Key: string, userId: string): Promise<boolean> {
    try {
      // Check if the user owns the file
      const { data, error } = await supabase
        .from('audio_files')
        .select('id')
        .eq('s3_key', s3Key)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new Error('File not found or you do not have permission to delete it');
      }

      // Delete the file from S3
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      await this.s3Client.send(command);

      // Delete metadata from Supabase
      // Note: We don't need to delete from audio_files table because
      // there's a CASCADE constraint on the audio_comments table
      await supabase
        .from('audio_files')
        .delete()
        .eq('s3_key', s3Key);

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get all audio files for a user
   * @param userId User ID
   * @returns List of audio files
   */
  async getUserFiles(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select(`
          id,
          title,
          description,
          s3_key,
          requires_approval,
          approved,
          approved_by,
          approved_at,
          share_id,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  }

  /**
   * Get an audio file by its share ID
   * @param shareId Share ID of the file
   * @returns Audio file data including presigned URL
   */
  async getFileByShareId(shareId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select(`
          id,
          user_id,
          title,
          description,
          s3_key,
          requires_approval,
          approved,
          created_at,
          broadcaster_profiles(name, avatar_url)
        `)
        .eq('share_id', shareId)
        .single();

      if (error || !data) {
        throw new Error('File not found');
      }

      // If file requires approval and is not approved, throw error
      if (data.requires_approval && !data.approved) {
        throw new Error('This file is awaiting approval');
      }

      // Generate presigned URL
      const url = await this.getFileUrl(data.s3_key);

      return {
        ...data,
        url
      };
    } catch (error) {
      console.error('Error getting file by share ID:', error);
      throw error;
    }
  }

  /**
   * Approve an audio file
   * @param fileId File ID
   * @param approverId Approver's user ID
   * @returns True if successfully approved
   */
  async approveFile(fileId: string, approverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audio_files')
        .update({
          approved: true,
          approved_by: approverId,
          approved_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error approving file:', error);
      throw error;
    }
  }
}

export const s3Service = new S3Service();
```

## Usage Examples

### 1. Uploading a File

```typescript
import { s3Service } from '../services/S3Service';

// In a component or form handler
const handleFileUpload = async (file: File) => {
  try {
    const { user } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const result = await s3Service.uploadFile(file, user.id, {
      title: 'My Audio Recording',
      description: 'Recorded on February 26, 2025',
      requiresApproval: true
    });
    
    console.log('File uploaded successfully with share ID:', result.shareId);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### 2. Playing a Shared File

```typescript
import { s3Service } from '../services/S3Service';
import { useEffect, useState } from 'react';

// In a component
const AudioPlayer = ({ shareId }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadAudioFile = async () => {
      try {
        setLoading(true);
        const fileData = await s3Service.getFileByShareId(shareId);
        setAudioFile(fileData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadAudioFile();
  }, [shareId]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>{audioFile.title}</h2>
      <p>{audioFile.description}</p>
      <audio src={audioFile.url} controls />
    </div>
  );
};
```

### 3. Managing User's Files

```typescript
import { s3Service } from '../services/S3Service';
import { useEffect, useState } from 'react';

// In a component
const UserFilesList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUserFiles = async () => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const userFiles = await s3Service.getUserFiles(user.id);
        setFiles(userFiles);
        setLoading(false);
      } catch (err) {
        console.error('Error loading files:', err);
        setLoading(false);
      }
    };
    
    loadUserFiles();
  }, []);
  
  const handleDelete = async (s3Key) => {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      await s3Service.deleteFile(s3Key, user.id);
      // Remove the file from the list
      setFiles(files.filter(file => file.s3_key !== s3Key));
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };
  
  if (loading) return <div>Loading your files...</div>;
  
  return (
    <div>
      <h2>Your Audio Files</h2>
      {files.length === 0 ? (
        <p>You haven't uploaded any files yet.</p>
      ) : (
        <ul>
          {files.map(file => (
            <li key={file.id}>
              <h3>{file.title}</h3>
              <p>{file.description}</p>
              <div>
                <button onClick={() => window.open(`/listen/${file.share_id}`)}>
                  Play
                </button>
                <button onClick={() => handleDelete(file.s3_key)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Next Steps

This implementation provides a robust S3 service for handling audio file uploads, retrievals, and management. After implementing this service, you will need to:

1. Create a migration script for the database tables
2. Update the type definitions
3. Create the UI components that will use this service
4. Update the routing to support the new functionality