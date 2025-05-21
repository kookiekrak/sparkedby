#!/usr/bin/env python3
import os
import time
from dotenv import load_dotenv

# Import modules
from src.config.logging import setup_logging
from src.config.secrets import get_secrets
from src.config.aws import initialize_aws_clients, get_queue_url
from src.services.transcription import TranscriptionService
from src.services.message_processor import MessageProcessor
from src.utils.signal_handlers import setup_signal_handlers

# Load environment variables (keep for local development)
load_dotenv()

def main():
    """Main function to start the Whisper worker."""
    # Set up logging
    logger = setup_logging()
    
    # Display environment information
    environment = os.getenv('ENVIRONMENT', 'development')
    logger.info(f"Starting Whisper worker in {environment} mode")
    if environment == 'development':
        logger.info("Using environment variables for configuration")
        logger.info("Make sure you have a .env file or environment variables set")
    else:
        logger.info("Using AWS Secrets Manager for configuration")
    
    # Set up signal handlers
    setup_signal_handlers()
    
    # Get secrets
    logger.info("Initializing secrets...")
    secrets = get_secrets()
    logger.debug(f"Initialized secrets with keys: {list(secrets.keys())}")
    
    # Initialize AWS clients
    logger.info("Initializing AWS clients...")
    aws_clients = initialize_aws_clients()
    sqs_client = aws_clients['sqs']
    
    # Get queue URL
    queue_url = get_queue_url()
    logger.info(f"Using queue URL: {queue_url}")
    
    # Initialize services
    transcription_service = TranscriptionService(secrets['OPENAI_API_KEY'])
    message_processor = MessageProcessor(aws_clients, transcription_service, secrets)
    
    logger.info(f"Starting Whisper worker, polling queue: {queue_url}")
    logger.debug(f"Using AWS region: {aws_clients['region']}")
    logger.debug(f"Using S3 bucket: {os.getenv('S3_BUCKET_NAME')}")
    logger.info("Press Ctrl+C to exit gracefully")
    
    # Main loop
    while True:
        try:
            # Receive message from SQS queue
            logger.debug("Polling SQS queue...")
            response = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                MessageAttributeNames=['All'],
                VisibilityTimeout=300  # Increased to 5 minutes
            )

            messages = response.get('Messages', [])
            if not messages:
                logger.debug("No messages received")
                continue
            
            logger.debug(f"Received {len(messages)} messages")
            
            for message in messages:
                message_id = message['MessageId']
                receipt_handle = message['ReceiptHandle']
                logger.info(f"Processing message {message_id}")
                
                success = message_processor.process_message(message)
                
                if success:
                    # Delete message only if processing was successful
                    logger.info(f"Successfully processed message {message_id}, deleting from queue")
                    sqs_client.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=receipt_handle
                    )
                    logger.debug(f"Deleted message {message_id} from queue")
                else:
                    logger.warning(f"Failed to process message {message_id}, removing from queue")
                    # Delete failed message instead of leaving it for retry
                    sqs_client.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=receipt_handle
                    )
                    logger.debug(f"Deleted failed message {message_id} from queue")

        except Exception as e:
            logger.error(f"Error in main loop: {e}", exc_info=True)
            time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    main() 