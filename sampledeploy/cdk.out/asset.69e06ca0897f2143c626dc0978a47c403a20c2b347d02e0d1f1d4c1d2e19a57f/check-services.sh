#!/bin/bash

# Set variables
LOCALSTACK_URL="http://localhost:4566"
MAX_ATTEMPTS=30
SLEEP_TIME=2

echo "Checking if Localstack services are available..."

# Function to check if service is available
check_service() {
  curl -s -o /dev/null -w "%{http_code}" $1
}

# Wait for Localstack to be ready
attempts=0
while [ $attempts -lt $MAX_ATTEMPTS ]; do
  status=$(check_service $LOCALSTACK_URL)
  
  if [ "$status" = "200" ] || [ "$status" = "404" ]; then
    echo "Localstack is up and running!"
    break
  fi
  
  echo "Waiting for Localstack to be ready... (attempt $((attempts+1))/$MAX_ATTEMPTS)"
  attempts=$((attempts+1))
  sleep $SLEEP_TIME
done

if [ $attempts -eq $MAX_ATTEMPTS ]; then
  echo "Failed to connect to Localstack after $MAX_ATTEMPTS attempts."
  exit 1
fi

# Wait a bit to ensure S3 and SQS services are initialized
echo "Waiting for services to initialize..."
sleep 5

# Display service information
echo "================================================================"
echo "                  LOCAL DEVELOPMENT SERVICES                    "
echo "================================================================"
echo "Localstack URL: $LOCALSTACK_URL"
echo "S3 Bucket URL: $LOCALSTACK_URL/whisperprocessing-files"
echo "SQS Queue URL: $LOCALSTACK_URL/000000000000/whisperprocessing-whisper-jobs"
echo "================================================================"
echo "Environment variables for API and UI projects:"
echo "AWS_ENDPOINT_URL=$LOCALSTACK_URL"
echo "AWS_REGION=us-east-1"
echo "AWS_ACCESS_KEY_ID=test"
echo "AWS_SECRET_ACCESS_KEY=test"
echo "S3_BUCKET_NAME=whisperprocessing-files"
echo "WHISPER_QUEUE_URL=$LOCALSTACK_URL/000000000000/whisperprocessing-whisper-jobs"
echo "================================================================" 