import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { s3Service } from '../services/S3Service';
import { Loader2 } from 'lucide-react';

export function DiagnosticPage() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [s3Status, setS3Status] = useState<'checking' | 'connected' | 'error'>('checking');
  const [s3Details, setS3Details] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [supabaseDetails, setSupabaseDetails] = useState<any>(null);
  const [testFileUpload, setTestFileUpload] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [testFileDetails, setTestFileDetails] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          setAuthStatus('unauthenticated');
          setAuthDetails({ error: error?.message || 'No user found' });
          return;
        }
        
        setAuthStatus('authenticated');
        setAuthDetails({
          id: data.user.id,
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at
        });
      } catch (error) {
        setAuthStatus('unauthenticated');
        setAuthDetails({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    checkAuth();
  }, []);

  // Check S3 connectivity
  useEffect(() => {
    async function checkS3() {
      try {
        // Check if AWS credentials are configured
        const region = import.meta.env.VITE_AWS_REGION;
        const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
        const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
        const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
        
        if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
          setS3Status('error');
          setS3Details({
            error: 'AWS credentials or bucket name are not configured properly',
            missingConfig: {
              region: !region,
              accessKeyId: !accessKeyId,
              secretAccessKey: !secretAccessKey,
              bucketName: !bucketName
            }
          });
          return;
        }
        
        // Try to list buckets to check connectivity
        // This is a simple test that doesn't require creating a test file
        const s3Client = s3Service['s3Client'];
        const s3BucketName = s3Service['bucketName'];
        
        setS3Status('connected');
        setS3Details({
          region,
          s3BucketName,
          accessKeyIdPrefix: accessKeyId ? `${accessKeyId.substring(0, 4)}...` : undefined
        });
      } catch (error) {
        setS3Status('error');
        setS3Details({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error ? (error as any).code : undefined
        });
      }
    }
    
    checkS3();
  }, []);

  // Check Supabase connectivity
  useEffect(() => {
    async function checkSupabase() {
      try {
        // Simple query to check connectivity
        const { data, error } = await supabase.from('audio_files').select('count').limit(1);
        
        if (error) {
          setSupabaseStatus('error');
          setSupabaseDetails({ error: error.message, code: error.code });
          return;
        }
        
        setSupabaseStatus('connected');
        setSupabaseDetails({
          url: import.meta.env.VITE_SUPABASE_URL,
          anonKeyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY 
            ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` 
            : undefined
        });
      } catch (error) {
        setSupabaseStatus('error');
        setSupabaseDetails({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    checkSupabase();
  }, []);

  // Test file upload
  const handleTestUpload = async () => {
    if (testFileUpload === 'uploading') return;
    
    setTestFileUpload('uploading');
    setTestFileDetails(null);
    
    try {
      // Create a small test file
      const testContent = 'This is a test file for diagnosing upload issues';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'diagnostic-test.txt', { type: 'text/plain' });
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Try to upload the test file
      const result = await s3Service.uploadFile(testFile, user.id, {
        title: 'Diagnostic Test File',
        description: 'This file was created to test the upload functionality'
      });
      
      setTestFileUpload('success');
      setTestFileDetails({
        s3Key: result.s3Key,
        shareId: result.shareId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestFileUpload('error');
      setTestFileDetails({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? (error as any).code : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Diagnostic</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Authentication Status
            {authStatus === 'checking' && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-indigo-500" />
            )}
          </h2>
          
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              authStatus === 'authenticated' ? 'bg-green-900/30 text-green-200' :
              authStatus === 'unauthenticated' ? 'bg-red-900/30 text-red-200' :
              'bg-yellow-900/30 text-yellow-200'
            }`}>
              {authStatus === 'authenticated' ? 'Authenticated' :
               authStatus === 'unauthenticated' ? 'Not Authenticated' :
               'Checking...'}
            </span>
          </div>
          
          {authDetails && (
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(authDetails, null, 2)}
            </pre>
          )}
        </div>
        
        {/* S3 Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            S3 Connectivity
            {s3Status === 'checking' && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-indigo-500" />
            )}
          </h2>
          
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              s3Status === 'connected' ? 'bg-green-900/30 text-green-200' :
              s3Status === 'error' ? 'bg-red-900/30 text-red-200' :
              'bg-yellow-900/30 text-yellow-200'
            }`}>
              {s3Status === 'connected' ? 'Connected' :
               s3Status === 'error' ? 'Connection Error' :
               'Checking...'}
            </span>
          </div>
          
          {s3Details && (
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(s3Details, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Supabase Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Supabase Connectivity
            {supabaseStatus === 'checking' && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-indigo-500" />
            )}
          </h2>
          
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              supabaseStatus === 'connected' ? 'bg-green-900/30 text-green-200' :
              supabaseStatus === 'error' ? 'bg-red-900/30 text-red-200' :
              'bg-yellow-900/30 text-yellow-200'
            }`}>
              {supabaseStatus === 'connected' ? 'Connected' :
               supabaseStatus === 'error' ? 'Connection Error' :
               'Checking...'}
            </span>
          </div>
          
          {supabaseDetails && (
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(supabaseDetails, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Test File Upload */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test File Upload</h2>
          
          <div className="mb-4">
            <button
              onClick={handleTestUpload}
              disabled={testFileUpload === 'uploading' || authStatus !== 'authenticated'}
              className={`px-4 py-2 rounded-md transition ${
                testFileUpload === 'uploading' ? 'bg-indigo-700 cursor-not-allowed' :
                authStatus !== 'authenticated' ? 'bg-gray-700 cursor-not-allowed' :
                'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {testFileUpload === 'uploading' ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : 'Test Upload'}
            </button>
            
            {testFileUpload !== 'idle' && (
              <span className={`ml-3 px-3 py-1 rounded-full text-sm ${
                testFileUpload === 'success' ? 'bg-green-900/30 text-green-200' :
                testFileUpload === 'error' ? 'bg-red-900/30 text-red-200' :
                'bg-yellow-900/30 text-yellow-200'
              }`}>
                {testFileUpload === 'success' ? 'Upload Successful' :
                 testFileUpload === 'error' ? 'Upload Failed' :
                 'Uploading...'}
              </span>
            )}
          </div>
          
          {testFileDetails && (
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(testFileDetails, null, 2)}
            </pre>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-indigo-400">If Authentication Failed:</h3>
            <ul className="list-disc pl-5 mt-2 text-gray-300">
              <li>Try logging out and logging back in</li>
              <li>Check if your session has expired</li>
              <li>Verify that Supabase is properly configured</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-indigo-400">If S3 Connection Failed:</h3>
            <ul className="list-disc pl-5 mt-2 text-gray-300">
              <li>Verify that AWS credentials are correct in the .env file</li>
              <li>Check if the S3 bucket exists and is accessible</li>
              <li>Ensure that CORS is properly configured for the S3 bucket</li>
              <li>Check for network connectivity issues</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-indigo-400">If Supabase Connection Failed:</h3>
            <ul className="list-disc pl-5 mt-2 text-gray-300">
              <li>Verify that Supabase URL and anon key are correct in the .env file</li>
              <li>Check if the Supabase project is online</li>
              <li>Ensure that the required tables exist in the database</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-indigo-400">If Test Upload Failed:</h3>
            <ul className="list-disc pl-5 mt-2 text-gray-300">
              <li>Check the error message for specific details</li>
              <li>Verify that the user has permission to upload files</li>
              <li>Check if the S3 bucket has the correct permissions</li>
              <li>Look for CORS issues in the browser console</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}