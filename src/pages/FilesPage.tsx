import React, { useState, useEffect } from 'react';
import { useAudioFiles } from '../hooks/useAudioFiles';
import { AudioFileUpload } from '../components/AudioFileUpload';
import { AudioFilePlayer } from '../components/AudioFilePlayer';
import {
  Plus,
  FileAudio,
  Play,
  Share2,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Calendar,
  Loader2
} from 'lucide-react';
import type { AudioFile } from '../types';

export function FilesPage() {
  const { files, loading, error, uploadFile, deleteFile, refreshFiles } = useAudioFiles();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Reset the UI when refresh happens
  useEffect(() => {
    if (!loading) {
      setIsSharing(false);
    }
  }, [loading]);

  // Find the selected file when selectedFileId changes
  useEffect(() => {
    if (selectedFileId) {
      const file = files.find(f => f.id === selectedFileId);
      if (file) {
        setSelectedFile(file);
        
        // Get a presigned URL for the file
        (async () => {
          try {
            const { url } = await fetch(`/api/get-file-url?s3Key=${file.s3_key}`).then(r => r.json());
            setSelectedFileUrl(url);
          } catch (error) {
            console.error('Error getting file URL:', error);
          }
        })();
      }
    } else {
      setSelectedFile(null);
      setSelectedFileUrl(null);
    }
  }, [selectedFileId, files]);

  // Filter files based on search term
  const filteredFiles = files.filter(file => 
    file.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file deletion
  const handleDeleteFile = async (s3Key: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(s3Key);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  // Handle file share
  const handleShareFile = (shareId: string) => {
    const shareUrl = `${window.location.origin}/review/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsSharing(true);
    setShareSuccess(true);
    
    setTimeout(() => {
      setIsSharing(false);
      setShareSuccess(false);
    }, 3000);
  };

  // Handle upload completion
  const handleUploadComplete = () => {
    setShowUploadForm(false);
    refreshFiles();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Audio Files</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition flex items-center gap-2"
        >
          {showUploadForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Upload New
            </>
          )}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-8">
          <AudioFileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={error => console.error('Upload error:', error)}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Files</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Selected File Player */}
      {selectedFile && selectedFileUrl && (
        <div className="mb-8">
          <AudioFilePlayer
            fileUrl={selectedFileUrl}
            fileId={selectedFile.id}
            title={selectedFile.title}
            description={selectedFile.description}
            requiresApproval={selectedFile.requires_approval}
            isApproved={selectedFile.approved}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setSelectedFileId(null)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
            >
              Close Player
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-lg">Loading files...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 p-4 rounded-md text-red-200">
          <p>{error}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <FileAudio className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No audio files found</h2>
          <p className="text-gray-400 mb-6">
            {searchTerm ? 'No files match your search' : 'Upload your first audio file to get started'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Upload Audio File
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-16 h-16 bg-indigo-900/50 rounded-md flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedFileId(file.id)}
                >
                  <FileAudio className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-lg font-medium truncate cursor-pointer hover:text-indigo-400"
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    {file.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(file.created_at)}
                    </div>
                    {/* This would come from audio file metadata in a real app */}
                    {/* <div>{formatDuration(file.duration)}</div> */}
                    
                    {file.requires_approval && !file.approved && (
                      <span className="text-xs px-2 py-1 bg-yellow-800/30 text-yellow-200 rounded">
                        Awaiting Approval
                      </span>
                    )}
                    
                    {file.requires_approval && file.approved && (
                      <span className="text-xs px-2 py-1 bg-green-800/30 text-green-200 rounded">
                        Approved
                      </span>
                    )}
                  </div>
                  
                  {file.description && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                      {file.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedFileId(file.id)}
                    className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
                    title="Play"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleShareFile(file.share_id)}
                    className={`p-2 rounded-md transition ${
                      isSharing && shareSuccess 
                        ? 'bg-green-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title="Copy share link"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteFile(file.s3_key)}
                    className="p-2 bg-gray-700 rounded-md hover:bg-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}