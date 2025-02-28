// API endpoint to check S3 connectivity
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  try {
    const region = process.env.VITE_AWS_REGION;
    const accessKeyId = process.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.VITE_AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.VITE_S3_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      return res.status(500).json({
        success: false,
        message: 'AWS credentials or bucket name are not configured properly',
        missingConfig: {
          region: !region,
          accessKeyId: !accessKeyId,
          secretAccessKey: !secretAccessKey,
          bucketName: !bucketName
        }
      });
    }

    // Create S3 client
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Try to list buckets to check connectivity
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    // Check if our bucket exists in the list
    const bucketExists = response.Buckets?.some(bucket => bucket.Name === bucketName);

    if (!bucketExists) {
      return res.status(404).json({
        success: false,
        message: `Bucket "${bucketName}" not found in your AWS account`,
        availableBuckets: response.Buckets?.map(b => b.Name) || []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to S3',
      bucketName,
      region
    });
  } catch (error) {
    console.error('S3 connection check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error connecting to S3',
      error: error.message,
      code: error.code,
      name: error.name
    });
  }
}