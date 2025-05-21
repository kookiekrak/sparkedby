import { Response } from 'express';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { AuthenticatedRequest } from '../middleware/auth';
import { wrapAuthenticatedHandler } from '../middleware/handlers';
import { envConfig } from '../utils/env-loader';
import fetch from 'node-fetch';
import { Visit } from '../types/supabaseCustom';

// Initialize SQS client with environment-appropriate configuration
const sqsClient = new SQSClient({ 
  region: process.env.AWS_REGION || 'us-east-2',
  // Only use custom endpoint in local development
  ...(process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true'
    ? {
        endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
        }
      } 
    : { credentials: fromEnv() })
});

const getQueueUrl = () => {
  const queueUrl = process.env.WHISPER_QUEUE_URL;
  if (!queueUrl) throw new Error('Missing WHISPER_QUEUE_URL configuration');
  return queueUrl;
};

// Function to send a message directly to LocalStack SQS using fetch
async function sendLocalStackSQSMessage(queueUrl: string, messageBody: string, messageAttributes: Record<string, any>) {
  console.log('[ProcessAudio] Sending to LocalStack directly with fetch:', queueUrl);
  
  // Extract queue name from URL (format: http://localhost:4566/000000000000/queue-name)
  const urlParts = queueUrl.split('/');
  const queueName = urlParts[urlParts.length - 1];
  
  // Prepare the URL with query parameters for SQS
  const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  const params = new URLSearchParams();
  params.append('Action', 'SendMessage');
  params.append('QueueUrl', queueUrl);
  params.append('MessageBody', messageBody);
  
  // Add message attributes
  Object.entries(messageAttributes).forEach(([key, attr], index) => {
    params.append(`MessageAttribute.${index + 1}.Name`, key);
    params.append(`MessageAttribute.${index + 1}.Value.DataType`, attr.DataType);
    params.append(`MessageAttribute.${index + 1}.Value.StringValue`, attr.StringValue);
  });
  
  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': new URL(endpoint).host
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LocalStack SQS request failed: ${response.status} ${response.statusText}\n${text}`);
    }
    
    const responseText = await response.text();
    console.log('[ProcessAudio] LocalStack SQS response:', responseText);
    
    // Extract message ID from response
    const messageIdMatch = responseText.match(/<MessageId>(.*?)<\/MessageId>/);
    const messageId = messageIdMatch ? messageIdMatch[1] : 'unknown';
    
    return { 
      success: true, 
      MessageId: messageId
    };
  } catch (error) {
    console.error('[ProcessAudio] LocalStack SQS fetch error:', error);
    throw error;
  }
}

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
    // Load the visit object to check for audio_language
    console.log('[ProcessAudio] Loading visit data');
    const { data: visit, error: visitError } = await serviceClient
      .from('visits')
      .select('id, audio_language')
      .eq('id', visitId)
      .single<Visit>();

    if (visitError) {
      console.error('[ProcessAudio] Failed to load visit:', visitError);
      throw visitError;
    }

    // Create a job record in the containers table
    console.log('[ProcessAudio] Creating container record');
    const { data: container, error: containerError } = await serviceClient
      .from('containers')
      .insert({
        visit_id: visitId,
        chunk_id: chunkId,
        state: 'pending',
        ...(visit?.audio_language ? { audio_language: visit.audio_language } : {})
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
      contentType,
      ...(visit?.audio_language ? { audioLanguage: visit.audio_language } : {})
    };

    console.log('[ProcessAudio] Sending message to SQS:', {
      queueUrl: getQueueUrl(),
      message,
      isLocalDevelopment: envConfig.isLocalDevelopment
    });

    const messageBody = JSON.stringify(message);
    
    let sqsResult;
    
    // Use different approaches for local development vs production
    if (envConfig.isLocalDevelopment) {
      // Use direct fetch for LocalStack
      sqsResult = await sendLocalStackSQSMessage(getQueueUrl(), messageBody, {});
    } else {
      // Use AWS SDK for production
      const command = new SendMessageCommand({
        QueueUrl: getQueueUrl(),
        MessageBody: messageBody,
        MessageAttributes: {}
      });
      
      sqsResult = await sqsClient.send(command);
    }

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