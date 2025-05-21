import os
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

def initialize_aws_clients():
    """Initialize AWS clients with appropriate configuration."""
    region = os.getenv('AWS_REGION', 'us-east-2')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    # Base config that's always needed
    config = {
        'region_name': region
    }
    
    # Only add endpoint URL and test credentials in development
    if environment == 'development':
        endpoint_url = os.getenv('AWS_ENDPOINT_URL')
        if endpoint_url:
            config['endpoint_url'] = endpoint_url
            # LocalStack compatibility settings
            config['aws_access_key_id'] = 'test'
            config['aws_secret_access_key'] = 'test'
    
    # Initialize clients with appropriate config
    s3_client = boto3.client('s3', **config)
    sqs_client = boto3.client('sqs', **config)
    secrets_client = boto3.client('secretsmanager', **config)
    
    return s3_client, sqs_client, secrets_client

def get_queue_url():
    """Get the SQS queue URL from environment variables."""
    # Always use the main queue URL, regardless of environment
    queue_url = os.getenv('WHISPER_QUEUE_URL')
    
    if not queue_url:
        raise ValueError("SQS queue URL not configured. Set WHISPER_QUEUE_URL environment variable.")
    
    return queue_url