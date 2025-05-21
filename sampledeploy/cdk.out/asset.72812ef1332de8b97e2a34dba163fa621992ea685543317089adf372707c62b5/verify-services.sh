#!/bin/bash
# Script to verify LocalStack services initialization

# Exit on error
set -e

echo "====================================================="
echo "       VERIFYING LOCALSTACK SERVICES STATUS          "
echo "====================================================="

# Configure AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Check if LocalStack is running
echo "Checking if LocalStack is running..."
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
  echo "❌ ERROR: LocalStack is not running. Please start the containers first."
  exit 1
else
  echo "✅ LocalStack is running"
fi

# Check if the S3 bucket exists
echo "Checking S3 bucket: whisperprocessing-files..."
if aws --endpoint-url=http://localhost:4566 s3 ls s3://whisperprocessing-files > /dev/null 2>&1; then
  echo "✅ S3 bucket 'whisperprocessing-files' exists"
else
  echo "❌ S3 bucket 'whisperprocessing-files' does not exist!"
  echo "Attempting to create it now..."
  aws --endpoint-url=http://localhost:4566 s3 mb s3://whisperprocessing-files
fi

# Check if the SQS queue exists
echo "Checking SQS queue: whisperprocessing-whisper-jobs..."
if aws --endpoint-url=http://localhost:4566 sqs get-queue-url --queue-name whisperprocessing-whisper-jobs > /dev/null 2>&1; then
  echo "✅ SQS queue 'whisperprocessing-whisper-jobs' exists"
else
  echo "❌ SQS queue 'whisperprocessing-whisper-jobs' does not exist!"
  echo "Attempting to create it now..."
  aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name whisperprocessing-whisper-jobs
fi

# Check S3 bucket CORS configuration
echo "Checking S3 bucket CORS configuration..."
if aws --endpoint-url=http://localhost:4566 s3api get-bucket-cors --bucket whisperprocessing-files > /dev/null 2>&1; then
  echo "✅ CORS configuration exists for S3 bucket"
else
  echo "❌ CORS configuration is missing for S3 bucket!"
  echo "Applying CORS configuration..."
  aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
    --bucket whisperprocessing-files \
    --cors-configuration '{
      "CORSRules": [
        {
          "AllowedOrigins": ["*"],
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
          "MaxAgeSeconds": 3000,
          "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"]
        }
      ]
    }'
fi

# Check S3 bucket policy
echo "Checking S3 bucket policy..."
if aws --endpoint-url=http://localhost:4566 s3api get-bucket-policy --bucket whisperprocessing-files > /dev/null 2>&1; then
  echo "✅ Policy exists for S3 bucket"
else
  echo "❌ Policy is missing for S3 bucket!"
  echo "Applying bucket policy..."
  aws --endpoint-url=http://localhost:4566 s3api put-bucket-policy \
    --bucket whisperprocessing-files \
    --policy '{
      "Version": "2012-10-17",
      "Statement": [
          {
              "Sid": "PublicRead", 
              "Effect": "Allow",
              "Principal": "*",
              "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
              "Resource": [
                  "arn:aws:s3:::whisperprocessing-files",
                  "arn:aws:s3:::whisperprocessing-files/*"
              ]
          }
      ]
  }'
fi

echo "====================================================="
echo "                 VERIFICATION COMPLETE               "
echo "====================================================="
echo "✅ LocalStack is running"
echo "✅ S3 bucket: whisperprocessing-files"
echo "✅ SQS queue: whisperprocessing-whisper-jobs"
echo "✅ S3 Bucket URL: http://localhost:4566/whisperprocessing-files"
echo "✅ SQS Queue URL: http://localhost:4566/000000000000/whisperprocessing-whisper-jobs"
echo "=====================================================" 