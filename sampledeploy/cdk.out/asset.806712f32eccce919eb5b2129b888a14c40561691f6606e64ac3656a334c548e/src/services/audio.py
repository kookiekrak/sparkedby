import os
import logging
import ffmpeg
import shutil
from botocore.exceptions import ClientError

logger = logging.getLogger('whisper')

def process_audio_file(input_path, output_path, content_type, trim_silence=True):
    """Process audio file using ffmpeg to ensure it's a valid webm file optimized for WhisperX.
    
    Args:
        input_path (str): Path to input audio file
        output_path (str): Path to output audio file
        content_type (str): Content type of the audio file
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
            # logger.debug(f"FFmpeg command 1: {' '.join(cmd1)}")
            out1, err1 = ffmpeg.run(stream1, capture_stdout=True, capture_stderr=True, overwrite_output=True)
            # logger.debug(f"FFmpeg stderr 1: {err1.decode() if err1 else 'None'}")

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
            # logger.debug(f"FFmpeg command 2: {' '.join(cmd2)}")
            out2, err2 = ffmpeg.run(stream2, capture_stdout=True, capture_stderr=True, overwrite_output=True)
            # logger.debug(f"FFmpeg stderr 2: {err2.decode() if err2 else 'None'}")
            
            # Use the compressed file for transcription
            if os.path.exists(temp_compressed) and os.path.getsize(temp_compressed) > 0:
                logger.debug("Successfully processed audio file")
                
                # Step 3: Convert to proper WebM format
                try:
                    stream3 = ffmpeg.input(temp_compressed)
                    stream3 = ffmpeg.output(
                        stream3,
                        output_path,
                        acodec='libopus',  # WebM typically uses Opus codec for audio
                        ar=16000,
                        b='64k',  # Bitrate
                        y=None  # Override output file
                    )
                    
                    # Run third processing step
                    cmd3 = ffmpeg.compile(stream3)
                    out3, err3 = ffmpeg.run(stream3, capture_stdout=True, capture_stderr=True, overwrite_output=True)
                    
                    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                        logger.debug("Successfully converted to WebM format")
                        return True
                    else:
                        logger.error("WebM conversion failed, output file was not created or is empty")
                        # Fallback if WebM conversion fails
                        shutil.copy2(temp_compressed, output_path)
                        logger.warning("Fallback: copied WAV as WebM (format mismatch)")
                        return True
                        
                except ffmpeg.Error as e:
                    logger.error(f"FFmpeg error in WebM conversion: {e.stderr.decode() if e.stderr else str(e)}")
                    # Fallback if WebM conversion fails
                    shutil.copy2(temp_compressed, output_path)
                    logger.warning("Fallback: copied WAV as WebM (format mismatch)")
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
        
        # Try multiple approaches to get the duration
        duration = None
        
        # Option 1: Check in stream info (most common location)
        if 'streams' in probe and len(probe['streams']) > 0:
            stream = probe['streams'][0]
            
            # Check for duration directly
            if 'duration' in stream:
                duration = float(stream['duration'])
            # Check for duration in tags
            elif 'tags' in stream and 'DURATION' in stream['tags']:
                duration_str = stream['tags']['DURATION']
                # Parse duration in format like "00:00:12.345"
                parts = duration_str.split(':')
                if len(parts) == 3:
                    hours, minutes, seconds = parts
                    seconds = float(seconds)
                    duration = 3600 * int(hours) + 60 * int(minutes) + seconds
        
        # Option 2: Check in format info
        if duration is None and 'format' in probe and 'duration' in probe['format']:
            duration = float(probe['format']['duration'])
            
        if duration is not None:
            logger.debug(f"Audio duration: {duration} seconds")
            return duration
        else:
            # If duration cannot be determined from metadata,
            # calculate it from file size and bitrate as a fallback
            if 'format' in probe and 'bit_rate' in probe['format'] and 'size' in probe['format']:
                bit_rate = float(probe['format']['bit_rate'])
                file_size = float(probe['format']['size'])
                # Very rough approximation
                estimated_duration = (file_size * 8) / bit_rate
                logger.warning(f"Estimated audio duration from bitrate: {estimated_duration} seconds")
                return estimated_duration
                
            logger.error("Could not determine audio duration from file metadata")
            # If we can't determine duration, try to run FFmpeg to get length
            try:
                cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                       '-of', 'default=noprint_wrappers=1:nokey=1', audio_path]
                import subprocess
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.stdout.strip():
                    logger.debug(f"Got duration via ffprobe command: {result.stdout.strip()}")
                    return float(result.stdout.strip())
            except Exception as e:
                logger.error(f"Failed to get duration via ffprobe command: {e}")
                
            return 0  # Last resort fallback
            
    except Exception as e:
        logger.error(f"Error getting audio duration: {e}")
        return 0 