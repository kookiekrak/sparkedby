import os
import logging
import requests
import time
import json
from openai import OpenAI
from .audio import get_audio_duration

logger = logging.getLogger('whisper')

class TranscriptionService:
    def __init__(self, openai_api_key):
        """Initialize the transcription service with OpenAI API key."""
        self.openai_client = OpenAI(
            api_key=openai_api_key
        )
        
    def transcribe_audio(self, audio_path, audio_language):
        """Transcribe audio using OpenAI Whisper API."""
        try:
            logger.debug(f"Transcribing audio file: {audio_path}")
            file_size = os.path.getsize(audio_path)
            logger.debug(f"Audio file size: {file_size} bytes")
            
            # Check audio duration
            duration = get_audio_duration(audio_path)
            if duration < 3:  # Skip transcription for audio less than 3 seconds
                logger.info(f"Audio file too short ({duration} seconds), returning empty transcription")
                return ""
            

            logger.debug(f"Transcription service audio language: {audio_language}")

            with open(audio_path, 'rb') as audio_file:
                # Only include language parameter if not 'auto'
                # DO NOT DELETE COMMENTED OUT CODE
                params = {
                    "model": "whisper-1",
                    # "model": "gpt-4o-transcribe",
                    "file": audio_file,
                    "response_format": "verbose_json"
                    # "response_format": "json",
                    # "include": ["logprobs"]
                }
                if audio_language and audio_language != 'auto':
                    params["language"] = audio_language[:2]
                    
                transcription = self.openai_client.audio.transcriptions.create(**params)
            logger.debug(f"Transcription response: {transcription}")
            
            # Create the response object
            response_data = {
                'text': transcription.text,
            }
            
            # Handle the language attribute which may not be present in the response
            # Use the language from the input if provided, otherwise set to 'en' as default
            if hasattr(transcription, 'language'):
                response_data['language'] = transcription.language
            elif audio_language and audio_language != 'auto':
                # Use the input language if explicitly provided
                response_data['language'] = audio_language[:2]
            else:
                # Default to English if no language information is available
                response_data['language'] = 'en'
                
            logger.info(f"Transcription result for container {audio_path.split('_')[-1].split('.')[0]}: {response_data['text'][:100]}...")
            
            return response_data
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None

    def send_transcription_to_api(self, api_url, api_token, visit_id, container_index, text, language, is_final):
        """Send transcription to API."""
        logger.debug(f"Initial API_URL: {api_url}")
        
        if not api_url:
            api_url = os.getenv('API_URL', 'http://localhost:3000')
            logger.warning(f"API_URL not found in secrets, using fallback: {api_url}")
        
        logger.info(f"Final API endpoint being used: {api_url}/update-container-text")

        if not api_token:
            raise Exception("API_TOKEN not found in secrets or environment")
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {api_token}",
            'Origin': 'https://app.eastmedical.ai',  # Add Origin header to match allowed origins
            'User-Agent': 'WhisperWorker/1.0'  # Identify the client
        }
        
        update_data = {
            'visitId': visit_id,
            'containerIndex': container_index,
            'text': text,
            'language': language,
            'isFinal': is_final
        }
        
        logger.debug(f"Sending transcription to API: {update_data}")
        logger.debug(f"API request headers: {headers}")
        logger.debug(f"API URL: {api_url}/update-container-text")
        logger.info(f"Making API call with isFinal={update_data['isFinal']}")
        
        # Track API call timing
        start_time = time.time()
        try:
            response = requests.post(
                f"{api_url}/update-container-text",
                headers=headers,
                json=update_data,
                timeout=30  # Increase timeout to 30 seconds to prevent premature timeouts
            )
            elapsed_time = time.time() - start_time
            logger.debug(f"API call completed in {elapsed_time:.2f} seconds")
            
            # Detailed response logging
            logger.debug(f"API response status: {response.status_code}")
            logger.debug(f"API response headers: {dict(response.headers)}")
            try:
                response_json = response.json()
                logger.debug(f"API response body: {response_json}")
            except ValueError:
                logger.debug(f"API response body (text): {response.text[:500]}")
            
            if not response.ok:
                logger.error(f"Failed to update container text: HTTP {response.status_code} - {response.text}")
                logger.error(f"Failed request details: URL={api_url}/update-container-text, Headers={headers}, Data={update_data}")
                raise Exception(f"Failed to update container text: HTTP {response.status_code}")
            
            logger.info(f"Successfully updated container {container_index} text (isFinal={update_data['isFinal']})")
            return True
            
        except requests.exceptions.Timeout:
            elapsed_time = time.time() - start_time
            logger.error(f"API call timed out after {elapsed_time:.2f} seconds")
            logger.error(f"Timeout request details: URL={api_url}/update-container-text, Headers={headers}, Data={update_data}")
            raise Exception(f"API call timed out after {elapsed_time:.2f} seconds")
        except requests.exceptions.ConnectionError as ce:
            logger.error(f"Connection error during API call: {str(ce)}")
            logger.error(f"Connection error details: URL={api_url}/update-container-text, Headers={headers}, Data={update_data}")
            logger.error(f"Target URL was: {api_url}/update-container-text")
            raise Exception(f"Connection error: {str(ce)}")
        except Exception as e:
            logger.error(f"Unexpected error during API call: {str(e)}")
            logger.error(f"Error request details: URL={api_url}/update-container-text, Headers={headers}, Data={update_data}")
            raise 