import os
import logging
import ffmpeg
import shutil
from botocore.exceptions import ClientError

logger = logging.getLogger('whisper')

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
                shutil.copy2(temp_compressed, output_path)
                return True
            else:
                logger.error("Output file was not created or is empty")
                # Fallback to direct copy if ffmpeg fails
                logger.debug("Falling back to direct copy")
                shutil.copy2(input_path, output_path)
                return True
                
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error in processing: {e.stderr.decode() if e.stderr else str(e)}")
            # Fallback to direct copy if ffmpeg fails
            logger.debug("Falling back to direct copy")
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

def download_from_s3(s3_client, bucket, key, local_path):
    """Download file from S3 to local path."""
    try:
        logger.debug(f"Downloading from S3: {bucket}/{key} -> {local_path}")
        s3_client.download_file(bucket, key, local_path)
        file_size = os.path.getsize(local_path)
        logger.debug(f"Successfully downloaded file. Size: {file_size} bytes")
        return True
    except ClientError as e:
        logger.error(f"Error downloading from S3: {e}")
        return False

def get_audio_duration(audio_path):
    """Get duration of audio file in seconds using ffmpeg."""
    try:
        probe = ffmpeg.probe(audio_path)
        duration = float(probe['streams'][0]['duration'])
        logger.debug(f"Audio duration: {duration} seconds")
        return duration
    except Exception as e:
        logger.error(f"Error getting audio duration: {e}")
        return 0 