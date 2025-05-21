import { Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { AuthenticatedRequest } from '../middleware/auth';
import { wrapAuthenticatedHandler } from '../middleware/handlers';

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' });

const handleUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { key, contentType, visitId, chunkId, isFinal } = req.body;

  if (!key || !contentType || !visitId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  try {
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

    res.json({ uploadUrl: url, fields });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

export const getUploadUrl = wrapAuthenticatedHandler(handleUploadUrl); 