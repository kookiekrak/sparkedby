import { Response } from 'express';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { AuthenticatedRequest } from '../middleware/auth';
import { wrapAuthenticatedHandler } from '../middleware/handlers';

// Initialize SQS client with explicit credentials
const sqsClient = new SQSClient({ 
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: fromEnv() // This will look for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
});

const getQueueUrl = () => {
  const environment = process.env.ENVIRONMENT || 'development';
  const devQueue = process.env.WHISPER_QUEUE_URL_DEV;
  const prodQueue = process.env.WHISPER_QUEUE_URL_PROD;

  if (environment === 'production') {
    if (!prodQueue) throw new Error('Missing WHISPER_QUEUE_URL_PROD configuration');
    return prodQueue;
  }

  if (!devQueue) throw new Error('Missing WHISPER_QUEUE_URL_DEV configuration');
  return devQueue;
};

const handleProcessAudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { key, visitId, chunkId, isFinal, contentType = 'audio/webm' } = req.body;
  const { serviceClient } = req.supabase;

  console.log('[ProcessAudio] Starting processing:', {
    key,
    visitId,
    chunkId,
    isFinal,
    contentType,
    userId: req.user.id,
    environment: process.env.ENVIRONMENT,
    queueUrl: getQueueUrl()
  });

  // Validate all required parameters
  const missingParams = [];
  if (!key) missingParams.push('key');
  if (!visitId) missingParams.push('visitId');
  if (chunkId === undefined || chunkId === null) missingParams.push('chunkId');
  if (isFinal === undefined) missingParams.push('isFinal');

  if (missingParams.length > 0) {
    const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
    console.error('[ProcessAudio] Validation error:', errorMessage, { body: req.body });
    res.status(400).json({ error: errorMessage });
    return;
  }

  // Validate content type
  if (!contentType.startsWith('audio/')) {
    res.status(400).json({ error: "Invalid content type - must be an audio format" });
    return;
  }

  try {
    // Create a job record in the containers table
    console.log('[ProcessAudio] Creating container record');
    const { data: container, error: containerError } = await serviceClient
      .from('containers')
      .insert({
        visit_id: visitId,
        chunk_id: chunkId,
        state: 'pending',
      })
      .select()
      .single();

    if (containerError || !container) {
      console.error('[ProcessAudio] Failed to create container record:', containerError);
      throw containerError;
    }

    // Queue the job in SQS
    const message = {
      userId: req.user.id,
      containerId: container.id,
      s3Key: key,
      visitId,
      chunkId,
      isFinal: Boolean(isFinal),
      contentType
    };

    console.log('[ProcessAudio] Sending message to SQS:', {
      queueUrl: getQueueUrl(),
      message
    });

    const command = new SendMessageCommand({
      QueueUrl: getQueueUrl(),
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        userId: {
          DataType: 'String',
          StringValue: req.user.id
        },
        containerId: {
          DataType: 'String',
          StringValue: container.id.toString()
        },
        contentType: {
          DataType: 'String',
          StringValue: contentType
        },
        environment: {
          DataType: 'String',
          StringValue: process.env.ENVIRONMENT || 'development'
        }
      }
    });

    const sqsResult = await sqsClient.send(command);
    console.log('[ProcessAudio] Successfully sent message to SQS:', {
      messageId: sqsResult.MessageId,
      containerId: container.id,
      chunkId
    });

    res.json({ 
      success: true, 
      containerId: container.id,
      messageId: sqsResult.MessageId 
    });
  } catch (error) {
    console.error('[ProcessAudio] Error:', error);
    if (error instanceof Error) {
      console.error('[ProcessAudio] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ 
      error: "Failed to queue audio processing",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const processAudio = wrapAuthenticatedHandler(handleProcessAudio); 