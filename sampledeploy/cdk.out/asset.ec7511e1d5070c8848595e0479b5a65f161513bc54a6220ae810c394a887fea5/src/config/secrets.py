import os
import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger('whisper')

def get_secrets():
    """Get secrets from AWS Secrets Manager in production, environment variables in development"""
    environment = os.getenv('ENVIRONMENT', 'development')
    
    if environment != 'production':
        logger.info("Development environment detected, using environment variables")
        
        # Define required environment variables
        required_env_vars = ['OPENAI_API_KEY', 'API_TOKEN']
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            logger.error(f"Missing required environment variables in development mode: {', '.join(missing_vars)}")
            logger.error("Please set these environment variables in your .env file or shell environment")
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Create secrets dictionary from environment variables
        secrets_dict = {
            'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
            'API_TOKEN': os.getenv('API_TOKEN'),
            'API_URL': os.getenv('API_URL', 'http://localhost:3000')  # Provide default for API_URL
        }
        
        logger.info("Successfully loaded secrets from environment variables")
        logger.debug(f"Environment variables loaded: {list(secrets_dict.keys())}")
        logger.debug(f"API_URL being used: {secrets_dict['API_URL']}")
        
        return secrets_dict
        
    # Production mode - use AWS Secrets Manager
    try:
        logger.info("Production environment detected, loading secrets from AWS Secrets Manager")
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=os.getenv('AWS_REGION', 'us-east-2')
        )
        
        logger.debug("Attempting to get secret 'whisperworker' from AWS Secrets Manager")
        response = client.get_secret_value(
            SecretId='whisperworker'
        )
        
        secrets = json.loads(response['SecretString'])
        logger.info("Successfully loaded secrets from AWS Secrets Manager")
        logger.debug(f"Retrieved secrets keys: {list(secrets.keys())}")
        
        # Validate required secrets
        required_secrets = ['OPENAI_API_KEY', 'API_TOKEN']
        missing_secrets = [secret for secret in required_secrets if secret not in secrets or not secrets[secret]]
        
        if missing_secrets:
            logger.error(f"Missing required secrets in AWS Secrets Manager: {', '.join(missing_secrets)}")
            raise ValueError(f"Missing required secrets: {', '.join(missing_secrets)}")
        
        # Validate API_URL specifically
        if 'API_URL' in secrets:
            if not secrets['API_URL']:
                logger.warning("API_URL in secrets is empty, using default")
                secrets['API_URL'] = os.getenv('API_URL', 'http://localhost:3000')
        else:
            logger.warning("API_URL key not found in secrets, using default")
            secrets['API_URL'] = os.getenv('API_URL', 'http://localhost:3000')
            
        logger.debug(f"Final API_URL being used: {secrets['API_URL']}")
        return secrets
    except ClientError as e:
        logger.error(f"Failed to get secrets from AWS Secrets Manager: {e}")
        raise  # In production, we want to fail if we can't get secrets 