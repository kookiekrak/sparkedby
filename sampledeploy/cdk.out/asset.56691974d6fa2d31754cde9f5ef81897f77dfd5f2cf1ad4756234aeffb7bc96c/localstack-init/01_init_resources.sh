#!/bin/bash
# Script to initialize LocalStack resources

# Exit on error
set -e

# Define retry parameters
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "Starting LocalStack initialization..."
echo "Waiting for LocalStack services to be fully available..."

# Function to check if services are running
check_services() {
  if curl -s http://localhost:4566/_localstack/health | grep -q "\"s3\": \"running\"" && \
     curl -s http://localhost:4566/_localstack/health | grep -q "\"sqs\": \"running\""; then
    return 0
  else
    return 1
  fi
}

# Wait for services to be ready
attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
  echo "Checking service readiness (attempt $attempt/$MAX_RETRIES)..."
  
  if check_services; then
    echo "✅ LocalStack services are running!"
    break
  fi
  
  if [ $attempt -eq $MAX_RETRIES ]; then
    echo "❌ LocalStack services did not become ready after $MAX_RETRIES attempts."
    exit 1
  fi
  
  echo "Waiting for LocalStack services to start... (attempt $attempt/$MAX_RETRIES)"
  attempt=$((attempt+1))
  sleep $RETRY_INTERVAL
done

# Function to retry a command with retries
retry_command() {
  local max_retries=$1
  local command=$2
  local retry_interval=$3
  local attempt=1
  
  echo "Executing: $command"
  
  while [ $attempt -le $max_retries ]; do
    echo "Attempt $attempt/$max_retries"
    if eval "$command"; then
      echo "Command successful!"
      return 0
    else
      echo "Attempt $attempt failed, retrying in $retry_interval seconds..."
      attempt=$((attempt+1))
      sleep $retry_interval
    fi
  done
  
  echo "Failed after $max_retries attempts"
  return 1
}

# Create S3 bucket
echo "Creating S3 bucket: whisperprocessing-files"
retry_command 5 "awslocal s3 mb s3://whisperprocessing-files" 3

# Verify S3 bucket exists
echo "Verifying S3 bucket exists..."
retry_command 5 "awslocal s3 ls | grep whisperprocessing-files" 3

# Create SQS queue
echo "Creating SQS queue: whisperprocessing-whisper-jobs"
retry_command 5 "awslocal sqs create-queue --queue-name whisperprocessing-whisper-jobs" 3

# Verify SQS queue exists
echo "Verifying SQS queue exists..."
retry_command 5 "awslocal sqs get-queue-url --queue-name whisperprocessing-whisper-jobs" 3

# Sleep for 5 seconds to ensure services are fully initialized
sleep 5

# Set bucket policy for public read access with retries
echo "Setting S3 bucket policy..."
retry_command 5 "awslocal s3api put-bucket-policy \
  --bucket whisperprocessing-files \
  --policy '{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
        {
            \"Sid\": \"PublicRead\", 
            \"Effect\": \"Allow\",
            \"Principal\": \"*\",
            \"Action\": [\"s3:GetObject\", \"s3:PutObject\", \"s3:DeleteObject\", \"s3:ListBucket\"],
            \"Resource\": [
                \"arn:aws:s3:::whisperprocessing-files\",
                \"arn:aws:s3:::whisperprocessing-files/*\"
            ]
        }
    ]
}'" 3

# Sleep for a second
sleep 1

# Set up CORS configuration with retries
echo "Setting up CORS configuration for S3 bucket..."
retry_command 5 "awslocal s3api put-bucket-cors \
  --bucket whisperprocessing-files \
  --cors-configuration '{
    \"CORSRules\": [
      {
        \"AllowedOrigins\": [\"*\"],
        \"AllowedHeaders\": [\"*\"],
        \"AllowedMethods\": [\"GET\", \"PUT\", \"POST\", \"DELETE\", \"HEAD\"],
        \"MaxAgeSeconds\": 3000,
        \"ExposeHeaders\": [\"ETag\", \"Content-Length\", \"Content-Type\"]
      }
    ]
  }'" 3

# List queues to verify
echo "Listing available queues:"
awslocal sqs list-queues

echo "========== LOCALSTACK RESOURCES INITIALIZED =========="
echo "S3 Bucket URL: http://localhost:4566/whisperprocessing-files"
echo "SQS Queue URL: http://localhost:4566/000000000000/whisperprocessing-whisper-jobs"
echo "=========================================================" 