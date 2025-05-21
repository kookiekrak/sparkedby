#!/bin/bash

# Set variables for checking services
echo "Starting Whisper app with service readiness check..."
MAX_ATTEMPTS=30
SLEEP_TIME=5
INITIAL_WAIT=5  # Give LocalStack a bit of time to initialize first

echo "Waiting initial ${INITIAL_WAIT} seconds for services to initialize..."
sleep ${INITIAL_WAIT}

# Function to check if AWS services are ready
check_services() {
  # Check if S3 service is accessible
  if aws --endpoint-url "${AWS_ENDPOINT_URL}" s3 ls >/dev/null 2>&1; then
    echo "✅ S3 service is accessible"
  else
    echo "❌ S3 service is NOT accessible"
    return 1
  fi

  # Check if SQS queue exists
  echo "Testing SQS queue: ${WHISPER_QUEUE_URL}"
  # Parse the queue name from the URL
  QUEUE_NAME=$(basename "${WHISPER_QUEUE_URL}")
  
  # Use curl instead of AWS CLI to check SQS service with explicit Action parameter
  SQS_ENDPOINT="${AWS_ENDPOINT_URL}"
  if curl -s -o /dev/null -w "%{http_code}" -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "Action=ListQueues" \
     "${SQS_ENDPOINT}" | grep -q "200"; then
    echo "✅ SQS service is accessible"
    
    # Check if our specific queue exists
    if curl -s -o /dev/null -w "%{http_code}" -X POST \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "Action=GetQueueUrl&QueueName=${QUEUE_NAME}" \
       "${SQS_ENDPOINT}" | grep -q "200"; then
      echo "✅ SQS queue exists"
    else
      echo "❌ SQS queue does not exist"
      
    fi
  else
    echo "❌ SQS service is NOT accessible"
    return 1
  fi
  
  return 0
}

# Wait for services to be available
echo "Checking AWS services..."
attempts=0
while [ $attempts -lt $MAX_ATTEMPTS ]; do
  echo "Checking AWS services (attempt $((attempts+1))/${MAX_ATTEMPTS})..."
  
  if check_services; then
    echo "✅ Success! All services are ready."
    break
  fi
  
  echo "AWS services not fully ready yet, waiting..."
  attempts=$((attempts+1))
  sleep $SLEEP_TIME
done

if [ $attempts -eq $MAX_ATTEMPTS ]; then
  echo "⚠️  WARNING: Could not verify all services after $MAX_ATTEMPTS attempts."
  echo "Exiting with failure - services not ready."
  exit 1
fi

echo "Starting Whisper application..."
exec python3 app.py 