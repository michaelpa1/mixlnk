#!/usr/bin/env node

/**
 * This script checks the S3 bucket configuration and CORS settings
 * Run with: node scripts/check-s3-config.js
 */

import { S3Client, GetBucketCorsCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

async function checkS3Config() {
  try {
    console.log('Checking S3 configuration...');
    
    // Get AWS credentials from environment variables
    const region = process.env.VITE_AWS_REGION;
    const accessKeyId = process.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.VITE_AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.VITE_S3_BUCKET_NAME;
    
    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('❌ Missing AWS credentials or bucket name in environment variables');
      console.log('Required environment variables:');
      console.log('- VITE_AWS_REGION:', region ? '✅ Set' : '❌ Missing');
      console.log('- VITE_AWS_ACCESS_KEY_ID:', accessKeyId ? '✅ Set' : '❌ Missing');
      console.log('- VITE_AWS_SECRET_ACCESS_KEY:', secretAccessKey ? '✅ Set' : '❌ Missing');
      console.log('- VITE_S3_BUCKET_NAME:', bucketName ? '✅ Set' : '❌ Missing');
      process.exit(1);
    }
    
    // Create S3 client
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    console.log(`\n📋 AWS Configuration:`);
    console.log(`- Region: ${region}`);
    console.log(`- Bucket: ${bucketName}`);
    console.log(`- Access Key ID: ${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)}`);
    
    // Check if bucket exists
    console.log('\n🔍 Checking if bucket exists...');
    const listBucketsCommand = new ListBucketsCommand({});
    const listBucketsResponse = await s3Client.send(listBucketsCommand);
    
    const bucketExists = listBucketsResponse.Buckets?.some(bucket => bucket.Name === bucketName);
    
    if (!bucketExists) {
      console.error(`❌ Bucket "${bucketName}" not found in your AWS account`);
      console.log('Available buckets:');
      listBucketsResponse.Buckets?.forEach(bucket => {
        console.log(`- ${bucket.Name}`);
      });
      process.exit(1);
    }
    
    console.log(`✅ Bucket "${bucketName}" exists`);
    
    // Check CORS configuration
    console.log('\n🔍 Checking CORS configuration...');
    const corsCommand = new GetBucketCorsCommand({
      Bucket: bucketName
    });
    
    try {
      const corsResponse = await s3Client.send(corsCommand);
      
      if (!corsResponse.CORSRules || corsResponse.CORSRules.length === 0) {
        console.error('❌ No CORS rules found for this bucket');
        console.log('You need to configure CORS to allow uploads from your domain');
        suggestCorsConfiguration();
        process.exit(1);
      }
      
      console.log('✅ CORS configuration found:');
      corsResponse.CORSRules.forEach((rule, index) => {
        console.log(`\nRule ${index + 1}:`);
        console.log(`- Allowed Origins: ${rule.AllowedOrigins.join(', ')}`);
        console.log(`- Allowed Methods: ${rule.AllowedMethods.join(', ')}`);
        console.log(`- Allowed Headers: ${rule.AllowedHeaders ? rule.AllowedHeaders.join(', ') : 'None'}`);
        console.log(`- Expose Headers: ${rule.ExposeHeaders ? rule.ExposeHeaders.join(', ') : 'None'}`);
        console.log(`- Max Age Seconds: ${rule.MaxAgeSeconds || 'Not set'}`);
      });
      
      // Check if CORS configuration allows uploads from the current domain
      const allowsAllOrigins = corsResponse.CORSRules.some(rule => 
        rule.AllowedOrigins.includes('*')
      );
      
      const allowsPutMethod = corsResponse.CORSRules.some(rule => 
        rule.AllowedMethods.includes('PUT') || rule.AllowedMethods.includes('*')
      );
      
      if (!allowsAllOrigins && !allowsPutMethod) {
        console.warn('⚠️ CORS configuration might not allow uploads from your domain');
        console.log('Make sure your CORS configuration includes:');
        console.log('- Your domain in AllowedOrigins (or "*" for testing)');
        console.log('- "PUT" in AllowedMethods');
        suggestCorsConfiguration();
      } else {
        console.log('\n✅ CORS configuration looks good for file uploads');
      }
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.error('❌ No CORS configuration found for this bucket');
        console.log('You need to configure CORS to allow uploads from your domain');
        suggestCorsConfiguration();
        process.exit(1);
      } else {
        console.error('❌ Error checking CORS configuration:', error.message);
        process.exit(1);
      }
    }
    
    console.log('\n✅ S3 configuration check completed successfully');
  } catch (error) {
    console.error('❌ Error checking S3 configuration:', error.message);
    process.exit(1);
  }
}

function suggestCorsConfiguration() {
  console.log('\n📝 Suggested CORS configuration:');
  console.log(`
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],  // Replace with your domain in production
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
  `);
  console.log('You can set this configuration in the AWS S3 console or using the AWS CLI:');
  console.log(`aws s3api put-bucket-cors --bucket ${process.env.VITE_S3_BUCKET_NAME} --cors-configuration file://cors.json`);
}

checkS3Config().catch(console.error);