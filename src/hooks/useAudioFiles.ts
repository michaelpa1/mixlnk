import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { s3Service } from '../services/S3Service';
import type { AudioFile, AudioFileUploadMetadata } from '../types';

export function useAudioFiles() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load audio files for the current user
   */
  const loadUserFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userFiles = await s3Service.getUserFiles(user.id);
      setFiles(userFiles);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err instanceof Error ? err.message : 'Error loading files');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new audio file
   */
  const uploadFile = useCallback(async (file: File, metadata: AudioFileUploadMetadata) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await s3Service.uploadFile(file, user.id, metadata);
      
      // Reload files to include the new one
      await loadUserFiles();
      
      return result;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserFiles]);

  /**
   * Get an audio file by its share ID
   */
  const getFileByShareId = useCallback(async (shareId: string) => {
    try {
      setLoading(true);
      setError(null);

      const fileData = await s3Service.getFileByShareId(shareId);
      return fileData;
    } catch (err) {
      console.error('Error getting file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error getting file';
      console.log('Debug - Error in useAudioFiles:', errorMessage);
      setError(errorMessage);
      
      // Make sure we're rethrowing the original error
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an audio file
   */
  const deleteFile = useCallback(async (s3Key: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await s3Service.deleteFile(s3Key, user.id);
      
      // Update the files list by removing the deleted file
      setFiles(prevFiles => prevFiles.filter(file => file.s3_key !== s3Key));
      
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Error deleting file');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an audio file's metadata
   */
  const updateFileMetadata = useCallback(async (fileId: string, metadata: Partial<AudioFileUploadMetadata>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update the file metadata in Supabase
      const { error } = await supabase
        .from('audio_files')
        .update({
          title: metadata.title,
          description: metadata.description,
          requires_approval: metadata.requiresApproval
        })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Reload files to get the updated metadata
      await loadUserFiles();
      
      return true;
    } catch (err) {
      console.error('Error updating file metadata:', err);
      setError(err instanceof Error ? err.message : 'Error updating file metadata');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserFiles]);

  // Load files when the hook is first used
  useEffect(() => {
    loadUserFiles();
  }, [loadUserFiles]);

  return {
    files,
    loading,
    error,
    uploadFile,
    getFileByShareId,
    deleteFile,
    updateFileMetadata,
    refreshFiles: loadUserFiles
  };
}