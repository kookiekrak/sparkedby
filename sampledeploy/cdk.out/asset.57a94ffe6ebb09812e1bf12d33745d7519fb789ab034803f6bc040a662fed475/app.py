import os
import json
import time
import boto3
import ffmpeg
import requests
import tempfile
from openai import OpenAI
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import signal
import sys

# Load environment variables
load_dotenv()

# Enable debug logging
import logging

# Configure root logger to WARNING to suppress most external logs
logging.getLogger().setLevel(logging.WARNING)

# Configure our logger for debug
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Set botocore and urllib3 to WARNING
logging.getLogger('botocore').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

# Add a formatter and handler for our logger
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Initialize AWS clients
sqs = boto3.client('sqs',
    region_name=os.getenv('AWS_REGION', 'us-east-2'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

s3 = boto3.client('s3',
    region_name=os.getenv('AWS_REGION', 'us-east-2'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

# Initialize OpenAI client
openai_client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

def process_audio_file(input_path, output_path, trim_silence=True):
    """Process audio file using ffmpeg to ensure it's a valid webm file optimized for WhisperX.
    
    Args:
        input_path (str): Path to input audio file
        output_path (str): Path to output audio file
        trim_silence (bool): Whether to trim silence from the audio (default: True)
    """
    try:
        logger.debug(f"Processing audio file: {input_path} -> {output_path}")
        file_size = os.path.getsize(input_path)
        logger.debug(f"Input file size: {file_size} bytes")
        
        # Create temporary paths for intermediate files
        temp_wav = output_path.replace('.webm', '.wav')
        temp_compressed = output_path.replace('.webm', '.compressed.wav')
        
        try:
            # Step 1: Initial silence removal and normalization
            stream1 = ffmpeg.input(input_path, f='webm')
            stream1 = ffmpeg.filter(
                stream1,
                'silenceremove',
                start_periods=1,
                stop_periods=-1,
                start_threshold='-50dB',
                stop_threshold='-50dB',
                start_silence=0.2,
                stop_silence=0.2
            )
            stream1 = ffmpeg.filter(stream1, 'loudnorm')
            stream1 = ffmpeg.output(
                stream1,
                temp_wav,
                acodec='pcm_s16le',
                ar=16000,
                y=None  # Override output file
            )
            
            # Run first processing step
            cmd1 = ffmpeg.compile(stream1)
            logger.debug(f"FFmpeg command 1: {' '.join(cmd1)}")
            out1, err1 = ffmpeg.run(stream1, capture_stdout=True, capture_stderr=True, overwrite_output=True)
            logger.debug(f"FFmpeg stderr 1: {err1.decode() if err1 else 'None'}")

            # Step 2: Speech normalization
            stream2 = ffmpeg.input(temp_wav)
            stream2 = ffmpeg.filter(
                stream2,
                'speechnorm',
                e=50,
                r=0.0005,
                l=1
            )
            stream2 = ffmpeg.output(
                stream2,
                temp_compressed,
                acodec='pcm_s16le',
                ar=16000,
                y=None  # Override output file
            )
            
            # Run second processing step
            cmd2 = ffmpeg.compile(stream2)
            logger.debug(f"FFmpeg command 2: {' '.join(cmd2)}")
            out2, err2 = ffmpeg.run(stream2, capture_stdout=True, capture_stderr=True, overwrite_output=True)
            logger.debug(f"FFmpeg stderr 2: {err2.decode() if err2 else 'None'}")
            
            # Use the compressed file for transcription
            if os.path.exists(temp_compressed) and os.path.getsize(temp_compressed) > 0:
                logger.debug("Successfully processed audio file")
                # Copy the compressed file to the output path for transcription
                import shutil
                shutil.copy2(temp_compressed, output_path)
                return True
            else:
                logger.error("Output file was not created or is empty")
                # Fallback to direct copy if ffmpeg fails
                logger.debug("Falling back to direct copy")
                import shutil
                shutil.copy2(input_path, output_path)
                return True
                
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error in processing: {e.stderr.decode() if e.stderr else str(e)}")
            # Fallback to direct copy if ffmpeg fails
            logger.debug("Falling back to direct copy")
            import shutil
            shutil.copy2(input_path, output_path)
            return True
            
    except Exception as e:
        logger.error(f"Unexpected error processing audio file: {str(e)}")
        return False
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
            if os.path.exists(temp_compressed):
                os.remove(temp_compressed)
        except Exception as e:
            logger.warning(f"Failed to clean up temporary files: {e}")

def download_from_s3(bucket, key, local_path):
    """Download file from S3 to local path."""
    try:
        logger.debug(f"Downloading from S3: {bucket}/{key} -> {local_path}")
        s3.download_file(bucket, key, local_path)
        file_size = os.path.getsize(local_path)
        logger.debug(f"Successfully downloaded file. Size: {file_size} bytes")
        return True
    except ClientError as e:
        logger.error(f"Error downloading from S3: {e}")
        return False

def transcribe_audio(audio_path):
    """Transcribe audio using OpenAI Whisper API."""
    try:
        logger.debug(f"Transcribing audio file: {audio_path}")
        file_size = os.path.getsize(audio_path)
        logger.debug(f"Audio file size: {file_size} bytes")
        
        with open(audio_path, 'rb') as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        logger.debug(f"Transcription response: {transcription}")
        return transcription
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return None

def process_message(message):
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
            if not download_from_s3(bucket, body['s3Key'], raw_path):
                raise Exception("Failed to download from S3")

            # Process audio with ffmpeg
            if not process_audio_file(raw_path, processed_path):
                raise Exception("Failed to process audio file")

            # Transcribe audio
            transcription = transcribe_audio(processed_path)
            if not transcription:
                raise Exception("Failed to transcribe audio")
                
            logger.info(f"Transcription result for container {container_index}: {transcription}")

            # Send transcription to API
            api_url = os.getenv('API_URL', 'http://localhost:3000')
            api_token = os.getenv('API_TOKEN')
            if not api_token:
                raise Exception("API_TOKEN environment variable not set")
                
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {api_token}"
            }
            
            update_data = {
                'visitId': visit_id,
                'containerIndex': container_index,  # Already converted to int earlier
                'text': transcription,
                'isFinal': body.get('isFinal', False)
            }
            
            logger.debug(f"Sending transcription to API: {update_data}")
            
            response = requests.post(
                f"{api_url}/update-container-text",
                headers=headers,
                json=update_data
            )
            
            if not response.ok:
                logger.error(f"Failed to update container text: {response.status_code} - {response.text}")
                raise Exception("Failed to update container text")
                
            logger.info(f"Successfully updated container {container_index} text")

            return True
        finally:
            # Clean up temporary files
            cleanup_temp_files(temp_files)

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        return False

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    signal_name = 'SIGINT' if signum == signal.SIGINT else 'SIGTERM'
    logger.info(f"\nReceived {signal_name}. Shutting down gracefully...")
    sys.exit(0)

def cleanup_temp_files(temp_files):
    """Clean up temporary files if they exist"""
    for temp_file in temp_files:
        try:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)
                logger.info(f"Cleaned up temporary file: {temp_file}")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary file {temp_file}: {str(e)}")

def main():
    """Main loop to process messages from SQS queue."""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    queue_url = os.getenv('WHISPER_QUEUE_URL')
    if not queue_url:
        raise ValueError("WHISPER_QUEUE_URL environment variable not set")

    logger.info(f"Starting Whisper worker, polling queue: {queue_url}")
    logger.debug(f"Using AWS region: {os.getenv('AWS_REGION')}")
    logger.debug(f"Using S3 bucket: {os.getenv('S3_BUCKET_NAME')}")
    logger.info("Press Ctrl+C to exit gracefully")

    temp_files = []  # Initialize at the start
    try:
        while True:
            try:
                # Receive message from SQS queue
                logger.debug("Polling SQS queue...")
                response = sqs.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=20,
                    MessageAttributeNames=['All'],
                    VisibilityTimeout=2
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
                    
                    success = process_message(message)
                    
                    if success:
                        # Delete message only if processing was successful
                        logger.info(f"Successfully processed message {message_id}, deleting from queue")
                        sqs.delete_message(
                            QueueUrl=queue_url,
                            ReceiptHandle=receipt_handle
                        )
                        logger.debug(f"Deleted message {message_id} from queue")
                    else:
                        logger.warning(f"Failed to process message {message_id}, removing from queue")
                        # Delete failed message instead of leaving it for retry
                        sqs.delete_message(
                            QueueUrl=queue_url,
                            ReceiptHandle=receipt_handle
                        )
                        logger.debug(f"Deleted failed message {message_id} from queue")

            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                time.sleep(5)  # Wait before retrying
    finally:
        # Clean up at the end
        cleanup_temp_files(temp_files)

if __name__ == "__main__":
    main() 