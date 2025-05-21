#!/usr/bin/env python3
import os
import time
import logging
from dotenv import load_dotenv

# Import modules
from src.config.logging import setup_logging
from src.config.secrets import get_secrets, get_development_secrets
from src.config.aws import initialize_aws_clients
from src.services.transcription import TranscriptionService
from src.services.message_processor import MessageProcessor
from src.utils.signal_handlers import setup_signal_handlers

# Set up logging first
logger = setup_logging()

# Load environment variables (keep for local development)
load_dotenv()

def main():
    """Main function to run the Whisper worker."""
    try:
        # Display environment information
        environment = os.getenv('ENVIRONMENT', 'development')
        logger.info(f"Starting Whisper worker in {environment} mode")
        
        # Set up signal handlers
        setup_signal_handlers()
        
        # Initialize AWS clients
        s3_client, sqs_client, secrets_client = initialize_aws_clients()
        
        # Get secrets based on environment
        if environment == 'development':
            logger.info("Using environment variables for configuration")
            logger.info("Make sure you have a .env file or environment variables set")
            secrets = get_development_secrets()
        else:
            logger.info("Using AWS Secrets Manager for configuration")
            secrets = get_secrets()
        
        # Initialize services
        transcription_service = TranscriptionService(secrets['OPENAI_API_KEY'])
        message_processor = MessageProcessor(sqs_client, transcription_service, secrets)
        
        logger.info("Starting Whisper worker...")
        logger.debug(f"Using AWS region: {os.getenv('AWS_REGION')}")
        logger.debug(f"Using S3 bucket: {os.getenv('S3_BUCKET_NAME')}")
        logger.info("Press Ctrl+C to exit gracefully")
        
        # Start processing messages
        message_processor.start_processing()
        
    except Exception as e:
        logger.error(f"Failed to start Whisper worker: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    main() 