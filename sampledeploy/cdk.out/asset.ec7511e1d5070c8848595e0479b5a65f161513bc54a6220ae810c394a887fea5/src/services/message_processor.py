import os
import json
import logging
from .audio import process_audio_file, download_from_s3
from .transcription import TranscriptionService

logger = logging.getLogger('whisper')

class MessageProcessor:
    def __init__(self, aws_clients, transcription_service, secrets):
        """Initialize message processor with required services."""
        self.s3_client = aws_clients['s3']
        self.secrets = secrets
        self.transcription_service = transcription_service
        
    def cleanup_temp_files(self, temp_files):
        """Clean up temporary files if they exist"""
        for temp_file in temp_files:
            try:
                if temp_file and os.path.exists(temp_file):
                    os.remove(temp_file)
                    logger.info(f"Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file {temp_file}: {str(e)}")
                
    def process_message(self, message):
        """Process a single SQS message."""
        temp_files = []  # Initialize temp files list
        try:
            # Parse message body
            body = json.loads(message['Body'])
            logger.info(f"Processing message: {json.dumps(body, indent=2)}")
            logger.debug(f"Full message: {json.dumps(message, indent=2)}")

            # Ensure directories exist
            os.makedirs('./downloads', exist_ok=True)
            os.makedirs('./processed', exist_ok=True)

            # Create file paths using message ID or chunk ID for uniqueness
            chunk_id = body.get('chunkId')
            container_index = body.get('containerIndex')
            visit_id = body.get('visitId')
            
            # Validate required fields
            if not visit_id:
                raise Exception("Missing required field: visitId")
            if container_index is None:
                container_index = chunk_id  # Fall back to chunkId if containerIndex not provided
            if container_index is None:
                raise Exception("Missing both containerIndex and chunkId")
                
            message_id = message['MessageId']
            raw_path = f'./downloads/{message_id}_{chunk_id}.webm'
            processed_path = f'./processed/{message_id}_{chunk_id}.webm'
            
            # Add temporary paths to cleanup list
            temp_files.extend([raw_path, processed_path])
            
            try:
                # Download audio from S3
                bucket = os.getenv('S3_BUCKET_NAME', 'whisperprocessing-files')
                if not download_from_s3(self.s3_client, bucket, body['s3Key'], raw_path):
                    raise Exception("Failed to download from S3")

                # Process audio with ffmpeg
                if not process_audio_file(raw_path, processed_path):
                    raise Exception("Failed to process audio file")

                # Transcribe audio
                transcription = self.transcription_service.transcribe_audio(processed_path)
                    
                logger.info(f"Transcription result for container {container_index}: {transcription}")

                # Send transcription to API
                api_url = self.secrets.get('API_URL')
                api_token = self.secrets.get('API_TOKEN', os.getenv('API_TOKEN'))
                is_final = body.get('isFinal', False)
                
                success = self.transcription_service.send_transcription_to_api(
                    api_url, 
                    api_token, 
                    visit_id, 
                    container_index, 
                    transcription, 
                    is_final
                )

                return True
            finally:
                # Clean up temporary files
                self.cleanup_temp_files(temp_files)

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            return False 