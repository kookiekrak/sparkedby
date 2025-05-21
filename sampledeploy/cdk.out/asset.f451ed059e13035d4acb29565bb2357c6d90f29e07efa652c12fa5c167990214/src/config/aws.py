import os
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

def initialize_aws_clients():
    """Initialize AWS clients with appropriate configuration."""
    region = os.getenv('AWS_REGION', 'us-east-2')
    
    # Base config for production
    config = {
        'region_name': region
    }
    
    # Check if we're explicitly in development mode
    if os.getenv('ENVIRONMENT') == 'development':
        logger.info("Development mode detected, using LocalStack configuration")
        endpoint_url = os.getenv('AWS_ENDPOINT_URL')
        if endpoint_url:
            logger.info(f"Using custom AWS endpoint: {endpoint_url}")
            config['endpoint_url'] = endpoint_url
            # Add specific config for LocalStack compatibility
            config['aws_access_key_id'] = os.getenv('AWS_ACCESS_KEY_ID', 'test')
            config['aws_secret_access_key'] = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')
            # Use signature version 4 for better compatibility
            boto_config = Config(
                signature_version='v4',
                retries={'max_attempts': 10, 'mode': 'standard'},
                s3={'addressing_style': 'path'}  # Force path-style addressing for S3
            )
            config['config'] = boto_config
            # Force disabled SSL for LocalStack
            config['use_ssl'] = False
            config['verify'] = False  # Disable SSL verification
    else:
        logger.info("Production mode active, using AWS credentials from container role")
    
    # Initialize clients with appropriate config
    s3_client = boto3.client('s3', **config)
    sqs_client = boto3.client('sqs', **config)
    secrets_client = boto3.client('secretsmanager', **config)
    
    return s3_client, sqs_client, secrets_client

def get_queue_url():
    """Get the SQS queue URL from environment variables."""
    queue_url = os.getenv('WHISPER_QUEUE_URL')
    
    if not queue_url:
        raise ValueError("SQS queue URL not configured. Set WHISPER_QUEUE_URL environment variable.")
    
    return queue_url