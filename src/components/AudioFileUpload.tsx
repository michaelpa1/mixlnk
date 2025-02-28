import React, { useState, useRef, useCallback } from 'react';
import { useAudioFiles } from '../hooks/useAudioFiles';
import { Upload, X, FileAudio, Loader2 } from 'lucide-react';
import type { AudioFileUploadMetadata } from '../types';

interface AudioFileUploadProps {
  onUploadComplete?: (result: { shareId: string; title: string }) => void;
  onUploadError?: (error: Error) => void;
}

export function AudioFileUpload({ onUploadComplete, onUploadError }: AudioFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile } = useAudioFiles();

  // Simulate progress during upload
  const simulateProgress = useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 90 ? 90 : newProgress; // Cap at 90%, will go to 100% when complete
      });
    }, 300);
    return interval;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setErrorMessage('Please select an audio file');
        return;
      }
      setSelectedFile(file);
      // Prefill title with filename (without extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setErrorMessage('Please select an audio file');
        return;
      }
      setSelectedFile(file);
      // Prefill title with filename (without extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      
      console.log('Starting file upload process with file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`
      });
      
      // Start progress simulation
      const progressInterval = simulateProgress();
      
      const metadata: AudioFileUploadMetadata = {
        title: title.trim(),
        description: description.trim() || undefined,
        requiresApproval: true
      };

      console.log('Checking authentication status before upload...');
      // Check authentication status
      const authStatus = await fetch('/api/auth-status').catch(err => {
        console.error('Failed to check auth status:', err);
        return { ok: false, status: 0 };
      });
      
      if (!authStatus.ok && authStatus.status === 401) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      console.log('Calling uploadFile function...');
      const result = await uploadFile(selectedFile, metadata);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete({
          shareId: result.shareId,
          title: metadata.title
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Enhanced error reporting
      let errorMsg = 'Error uploading file';
      
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Check for specific error types
        if (error.message.includes('fetch') || error.message === 'Failed to fetch') {
          errorMsg = 'Network error: Could not connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('credentials') || error.message.includes('authentication')) {
          errorMsg = 'Authentication error: Your session may have expired. Please log out and log in again.';
        } else if (error.message.includes('bucket') || error.message.includes('S3')) {
          errorMsg = 'Storage error: There was a problem with the file storage service. Please try again later.';
        }
      }
      
      setErrorMessage(errorMsg);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">Upload Audio File</h2>
      
      {/* File Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 flex flex-col items-center justify-center cursor-pointer
          ${selectedFile ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <FileAudio className="h-12 w-12 text-indigo-500 mb-2" />
            <p className="text-lg font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-400">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              className="mt-2 p-1 bg-gray-700 rounded-full hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-center text-gray-300">
              Drag and drop your audio file here or click to browse
            </p>
            <p className="text-center text-gray-500 text-sm mt-1">
              Supports MP3, WAV, and M4A files
            </p>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Metadata Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter a title for your audio"
            disabled={uploading}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Enter a description"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition flex items-center gap-2"
          disabled={uploading || !selectedFile}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Audio File
            </>
          )}
        </button>
      </div>
    </div>
  );
}