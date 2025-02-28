import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AudioComment } from '../types';

export function useAudioComments(fileId: string) {
  const [comments, setComments] = useState<AudioComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load comments for an audio file
   */
  const loadComments = useCallback(async () => {
    if (!fileId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('audio_comments')
        .select(`
          id,
          file_id,
          user_id,
          timestamp,
          text,
          created_at,
          profile:broadcaster_profiles!user_id(name, avatar_url)
        `)
        .eq('file_id', fileId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      // Format the comments to match our AudioComment type
      const formattedComments = data.map(comment => ({
        id: comment.id,
        file_id: comment.file_id,
        user_id: comment.user_id,
        timestamp: comment.timestamp,
        text: comment.text,
        created_at: comment.created_at,
        user: comment.profile && comment.profile.length > 0 ? {
          name: comment.profile[0].name,
          avatar_url: comment.profile[0].avatar_url
        } : undefined
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  /**
   * Add a new comment to an audio file
   */
  const addComment = useCallback(async (timestamp: number, text: string) => {
    if (!fileId) {
      throw new Error('File ID is required');
    }
    
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('audio_comments')
        .insert({
          file_id: fileId,
          user_id: user.id,
          timestamp,
          text
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Get user profile info
      const { data: profileData } = await supabase
        .from('broadcaster_profiles')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Add the new comment to the comments state
      const newComment: AudioComment = {
        id: data.id,
        file_id: data.file_id,
        user_id: data.user_id,
        timestamp: data.timestamp,
        text: data.text,
        created_at: data.created_at,
        user: profileData ? {
          name: profileData.name,
          avatar_url: profileData.avatar_url
        } : undefined
      };

      setComments(prevComments => [...prevComments, newComment].sort((a, b) => a.timestamp - b.timestamp));
      
      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Error adding comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('audio_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove the deleted comment from the comments state
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Error deleting comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load comments when the hook is first used or when fileId changes
  useEffect(() => {
    if (fileId) {
      loadComments();
    }
  }, [fileId, loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refreshComments: loadComments
  };
}