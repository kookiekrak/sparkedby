/**
 * LocalStack Helper Utilities
 * Provides functions to help with LocalStack compatibility
 */
import { SQSClient, CreateQueueCommand, ListQueuesCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import { S3Client, CreateBucketCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

/**
 * Creates a configured SQS client for LocalStack
 */
export function createLocalstackSQSClient(): SQSClient {
  const region = process.env.AWS_REGION || 'us-east-1';
  const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  
  return new SQSClient({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    },
    // Skip SSL validation for local development
    tls: false,
    // Force to use the AWS SQS v2 compatible protocol
    // protocol: 'http'
  });
}

/**
 * Ensures the required SQS queue exists in LocalStack
 */
export async function ensureQueueExists(queueName: string): Promise<string> {
  const sqsClient = createLocalstackSQSClient();
  console.log(`[LocalStack] Ensuring queue exists: ${queueName}`);
  
  try {
    // First try to get the queue URL
    const getQueueCommand = new GetQueueUrlCommand({
      QueueName: queueName
    });
    
    try {
      const queueResult = await sqsClient.send(getQueueCommand);
      console.log(`[LocalStack] Queue already exists: ${queueName}`, queueResult);
      return queueResult.QueueUrl as string;
    } catch (error) {
      console.log(`[LocalStack] Queue does not exist, creating: ${queueName}`);
      
      // Queue doesn't exist, create it
      const createQueueCommand = new CreateQueueCommand({
        QueueName: queueName,
        Attributes: {
          DelaySeconds: '0',
          MessageRetentionPeriod: '86400'
        }
      });
      
      const createResult = await sqsClient.send(createQueueCommand);
      console.log(`[LocalStack] Queue created: ${queueName}`, createResult);
      return createResult.QueueUrl as string;
    }
  } catch (error) {
    console.error(`[LocalStack] Error ensuring queue exists: ${queueName}`, error);
    throw error;
  }
}

/**
 * Ensures the required S3 bucket exists in LocalStack
 */
export async function ensureBucketExists(bucketName: string): Promise<boolean> {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    },
    forcePathStyle: true,
    tls: false
  });
  
  console.log(`[LocalStack] Ensuring bucket exists: ${bucketName}`);
  
  try {
    // Check if bucket exists
    const listBucketsCommand = new ListBucketsCommand({});
    const listResult = await s3Client.send(listBucketsCommand);
    
    const bucketExists = listResult.Buckets?.some(bucket => bucket.Name === bucketName);
    
    if (!bucketExists) {
      console.log(`[LocalStack] Bucket does not exist, creating: ${bucketName}`);
      const createBucketCommand = new CreateBucketCommand({
        Bucket: bucketName
      });
      
      await s3Client.send(createBucketCommand);
      console.log(`[LocalStack] Bucket created: ${bucketName}`);
    } else {
      console.log(`[LocalStack] Bucket already exists: ${bucketName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[LocalStack] Error ensuring bucket exists: ${bucketName}`, error);
    throw error;
  }
} 