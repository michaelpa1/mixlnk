import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
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

    // Log credentials being used (masking sensitive info)
    console.log('AWS Configuration:', {
      region,
      accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)}` : undefined,
      bucketName: this.bucketName
    });

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
      console.log('Starting file upload process:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        userId
      });

      // Validate file type
      if (!file.type.startsWith('audio/')) {
        throw new Error('Only audio files are allowed');
      }

      // Generate a unique S3 key and share ID
      const s3Key = this.generateS3Key(userId, file.name);
      const shareId = this.generateShareId();
      
      console.log('Generated S3 key and share ID:', { s3Key, shareId });

      // Create a buffer from the file
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(fileArrayBuffer);
      console.log('File buffer created successfully');

      // Log S3 upload attempt
      console.log('Attempting S3 upload with parameters:', {
        bucket: this.bucketName,
        key: s3Key,
        contentType: file.type,
        metadataFields: Object.keys({
          'x-amz-meta-user-id': userId,
          'x-amz-meta-original-name': file.name,
          'x-amz-meta-title': metadata.title,
          'x-amz-meta-description': metadata.description || ''
        })
      });

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

      try {
        console.log('Sending S3 PutObject command...');
        console.log('S3 client configuration:', {
          region: this.s3Client.config.region,
          endpoint: this.s3Client.config.endpoint,
          bucketName: this.bucketName,
          commandInput: {
            Bucket: command.input.Bucket,
            Key: command.input.Key,
            ContentType: command.input.ContentType,
            MetadataKeys: Object.keys(command.input.Metadata || {})
          }
        });
        
        await this.s3Client.send(command);
        console.log('S3 upload successful');
      } catch (err) {
        // Type the error appropriately for AWS SDK errors
        const s3Error = err as Error & {
          code?: string;
          $metadata?: {
            requestId?: string;
            cfId?: string;
            httpStatusCode?: number;
          }
        };
        
        console.error('S3 upload error details:', {
          message: s3Error.message,
          code: s3Error.code,
          name: s3Error.name,
          requestId: s3Error.$metadata?.requestId,
          cfId: s3Error.$metadata?.cfId,
          httpStatusCode: s3Error.$metadata?.httpStatusCode,
          errorType: s3Error.constructor.name,
          stack: s3Error.stack
        });
        
        // Check for network errors
        if (s3Error.message.includes('fetch') || s3Error.message.includes('network')) {
          console.error('Network error detected. This could be due to:');
          console.error('1. CORS issues');
          console.error('2. Network connectivity problems');
          console.error('3. AWS endpoint unreachable');
        }
        
        // Check for authentication errors
        if (s3Error.message.includes('auth') || s3Error.message.includes('credentials') ||
            s3Error.code === 'CredentialsError' || s3Error.code === 'AuthorizationHeaderMalformed') {
          console.error('Authentication error detected. This could be due to:');
          console.error('1. Invalid AWS credentials');
          console.error('2. Expired credentials');
          console.error('3. Missing or malformed authorization header');
        }
        
        throw s3Error;
      }

      console.log('Saving metadata to Supabase...');
      // Detailed logging for Supabase metadata
      const supabasePayload = {
        user_id: userId,
        title: metadata.title,
        description: metadata.description,
        s3_key: s3Key,
        requires_approval: metadata.requiresApproval ?? true,
        approved: false,
        share_id: shareId
      };
      
      console.log('Supabase payload:', supabasePayload);
      
      // Save metadata to Supabase
      const response = await supabase.from('audio_files').insert(supabasePayload);
      const { error, data, status, statusText, count } = response;

      console.log('Supabase response:', {
        status,
        statusText,
        count,
        data,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error('Supabase metadata save error:', error);
        throw new Error(`Failed to save file metadata: ${error.message}`);
      }

      console.log('File upload and metadata save completed successfully');
      return { s3Key, shareId };
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Additional error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
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
      console.log('Debug - Looking for file with share_id:', shareId);
      
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
          share_id,
          broadcaster_profiles(name, avatar_url)
        `)
        .eq('share_id', shareId)
        .single();

      console.log('Debug - Supabase query result:', {
        error: error ? { message: error.message, code: error.code } : null,
        dataExists: !!data,
        data: data ? { id: data.id, share_id: data.share_id } : null
      });

      if (error || !data) {
        throw new Error('File not found');
      }

      // If file requires approval and is not approved, throw error
      if (data.requires_approval && !data.approved) {
        console.log('Debug - File requires approval and is not approved');
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