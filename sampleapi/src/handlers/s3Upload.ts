import { Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { AuthenticatedRequest } from '../middleware/auth';
import { wrapAuthenticatedHandler } from '../middleware/handlers';

// Only set endpoint in development mode
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-2',
  ...(process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true'
    ? {
        endpoint: process.env.AWS_ENDPOINT_URL,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
        },
        forcePathStyle: true, // This is critical for LocalStack to work correctly
      }
    : {})
};

console.log('[S3] Initializing S3 client with config:', JSON.stringify(s3Config, null, 2));

const s3Client = new S3Client(s3Config);

const handleUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { key, contentType, visitId, chunkId, isFinal } = req.body;

  if (!key || !contentType || !visitId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  try {
    // Check if we're in dev/local mode and force path style for the presigned URL
    const isLocalDev = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true';
    
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.S3_BUCKET_NAME || 'whisperprocessing-files',
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024], // up to 10MB
        ['starts-with', '$Content-Type', ''],
        ['starts-with', '$key', '']
      ],
      Fields: {
        'Content-Type': contentType,
        'key': key,
        'x-amz-meta-userid': req.user.id,
        'x-amz-meta-visitid': visitId,
        'x-amz-meta-chunkid': chunkId.toString(),
        'x-amz-meta-isfinal': isFinal.toString()
      },
      Expires: 3600, // 1 hour
    });

    console.log('[S3] Generated pre-signed URL:', {
      url,
      fields,
      key,
      userId: req.user.id,
      visitId,
      chunkId,
      contentType
    });

    // When in dev mode with LocalStack, ensure we return a path-style URL
    // to avoid virtual host style which doesn't work with LocalStack
    let finalUrl = url;
    if (isLocalDev && url.includes(process.env.S3_BUCKET_NAME || 'whisperprocessing-files')) {
      // Ensure the URL is in path-style format
      const bucketName = process.env.S3_BUCKET_NAME || 'whisperprocessing-files';
      const endpointUrl = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
      
      // If the URL is in virtual-hosted style (bucket.endpoint), convert it to path style
      if (url.startsWith(`http://${bucketName}.`)) {
        finalUrl = `${endpointUrl}/${bucketName}`;
        console.log('[S3] Converted virtual-host style URL to path style:', { original: url, fixed: finalUrl });
      }
    }

    res.json({ uploadUrl: finalUrl, fields });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

export const getUploadUrl = wrapAuthenticatedHandler(handleUploadUrl); 