// Type definitions for AWS SDK classes
type SecretManagerClientType = any;
type GetSecretValueCommandType = any;

// Optional import for AWS SDK - only needed in production
let SecretsManagerClient: SecretManagerClientType | undefined;
let GetSecretValueCommand: GetSecretValueCommandType | undefined;
try {
  // Dynamic import for AWS SDK - only needed in production
  const awsModule = require("@aws-sdk/client-secrets-manager");
  SecretsManagerClient = awsModule.SecretsManagerClient;
  GetSecretValueCommand = awsModule.GetSecretValueCommand;
} catch (error) {
  // In local development, the AWS SDK may not be available or needed
  console.log('AWS SDK not available - this is fine for local development');
}

// Interface for all app credentials
export interface AppCredentials {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  API_TOKEN: string;
}

// Cache the credentials to avoid unnecessary API calls
let cachedCredentials: AppCredentials | null = null;

/**
 * Determines if we're running in a local development environment
 */
export function isLocalDevelopment(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return nodeEnv === 'development' || nodeEnv === 'test';
}

/**
 * Retrieves all application credentials from AWS Secrets Manager
 */
export async function getAppCredentials(): Promise<AppCredentials> {
  // Return cached credentials if available
  if (cachedCredentials) {
    return cachedCredentials;
  }

  // Check if we have the secret ARN
  if (!process.env.APP_SECRET_ARN) {
    throw new Error('Missing APP_SECRET_ARN environment variable');
  }

  // Verify AWS SDK is available
  if (!SecretsManagerClient || !GetSecretValueCommand) {
    throw new Error('AWS SDK not available - cannot access Secrets Manager');
  }

  try {
    // Initialize Secrets Manager client
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-2'
    });

    // Retrieve the secret
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.APP_SECRET_ARN
      })
    );

    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }

    // Parse the JSON secret string
    const credentials = JSON.parse(response.SecretString) as AppCredentials;
    
    // Validate the required fields
    if (!credentials.SUPABASE_URL || !credentials.SUPABASE_KEY || !credentials.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Secret is missing required Supabase credentials');
    }

    if (!credentials.OPENAI_API_KEY) {
      throw new Error('Secret is missing OpenAI API key');
    }

    if (!credentials.API_TOKEN) {
      throw new Error('Secret is missing API token');
    }

    // Cache the credentials
    cachedCredentials = credentials;
    return credentials;
  } catch (error) {
    console.error('Error retrieving app credentials from Secrets Manager:', error);
    throw new Error('Failed to retrieve app credentials');
  }
}

/**
 * Gets credentials from environment variables
 * Used for local development or as a fallback
 */
export function getCredentialsFromEnv(): AppCredentials {
  // Check for required Supabase environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_KEY, and SUPABASE_SERVICE_ROLE_KEY required)');
  }

  // Check for required API environment variables
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (!process.env.API_TOKEN) {
    throw new Error('Missing API_TOKEN environment variable');
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    API_TOKEN: process.env.API_TOKEN
  };
}

/**
 * Retrieves the OpenAI API key
 */
export async function getOpenAIApiKey(): Promise<string> {
  const credentials = isLocalDevelopment() 
    ? getCredentialsFromEnv() 
    : await getAppCredentials();
  return credentials.OPENAI_API_KEY;
}

/**
 * Retrieves the API token
 */
export async function getApiToken(): Promise<string> {
  const credentials = isLocalDevelopment() 
    ? getCredentialsFromEnv() 
    : await getAppCredentials();
  return credentials.API_TOKEN;
}

/**
 * Verify if a provided token matches the stored API token
 */
export async function verifyApiToken(token: string): Promise<boolean> {
  try {
    const storedToken = await getApiToken();
    return token === storedToken;
  } catch (error) {
    console.error('Error verifying API token:', error);
    return false;
  }
} 