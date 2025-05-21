import os
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

def initialize_aws_clients():
    """Initialize and return AWS clients for services."""
    # Get AWS configuration
    region = os.getenv('AWS_REGION', 'us-east-2')
    endpoint_url = os.getenv('AWS_ENDPOINT_URL')
    
    # Common config for all services
    config = {
        'region_name': region
    }
    
    # Add endpoint_url for localstack if specified
    if endpoint_url:
        logger.info(f"Using custom AWS endpoint: {endpoint_url}")
        config['endpoint_url'] = endpoint_url
        # Add specific config for LocalStack compatibility
        config['aws_access_key_id'] = os.getenv('AWS_ACCESS_KEY_ID', 'test')
        config['aws_secret_access_key'] = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')
        # Use signature version 4 for better compatibility
        boto_config = Config(signature_version='v4', 
                             retries={'max_attempts': 10, 'mode': 'standard'})
        config['config'] = boto_config
        # Force path-style for S3 operations
        config['use_ssl'] = False
    
    # Initialize clients
    s3_client = boto3.client('s3', **config)
    sqs_client = boto3.client('sqs', **config)
    secretsmanager_client = boto3.client('secretsmanager', **config)
    
    clients = {
        's3': s3_client,
        'sqs': sqs_client,
        'secretsmanager': secretsmanager_client,
        'region': region
    }
    
    return clients

def get_queue_url():
    """Get the SQS queue URL from environment variables."""
    # Always use the main queue URL, regardless of environment
    queue_url = os.getenv('WHISPER_QUEUE_URL')
    
    if not queue_url:
        raise ValueError("SQS queue URL not configured. Set WHISPER_QUEUE_URL environment variable.")
    
    return queue_url