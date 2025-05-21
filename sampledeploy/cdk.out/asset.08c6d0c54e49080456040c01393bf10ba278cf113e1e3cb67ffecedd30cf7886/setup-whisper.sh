#!/bin/bash
# Whisper environment setup and maintenance script

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
  echo -e "${YELLOW}[WHISPER]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if .env file exists
check_env() {
  if [ ! -f .env ]; then
    print_error "No .env file found!"
    print_status "Creating sample .env file..."
    
    cat > .env << EOF
# Whisper environment variables
OPENAI_API_KEY=your_openai_api_key_here
ENVIRONMENT=development
EOF
    
    print_status "Created .env file. Please edit it with your OpenAI API key."
    return 1
  fi
  
  if ! grep -q "OPENAI_API_KEY" .env || grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
    print_error "OPENAI_API_KEY not properly set in .env file!"
    print_status "Please edit the .env file with your actual OpenAI API key."
    return 1
  fi
  
  print_success "Environment file looks good."
  return 0
}

# Function to start the Whisper environment
start_whisper() {
  print_status "Starting Whisper environment..."
  
  # Make sure init scripts are executable
  chmod +x localstack-init/*.sh
  chmod +x start-app.sh
  
  print_status "Starting Docker Compose services..."
  docker-compose down
  docker-compose up -d
  
  print_success "Whisper services started in the background."
  print_status "Check logs with: docker-compose logs -f"
}

# Function to verify AWS resources
verify_resources() {
  print_status "Verifying AWS resources..."
  
  # Wait a moment for services to be ready
  sleep 5
  
  # Check S3 bucket
  if docker exec whisper-localstack awslocal s3 ls | grep -q "whisperprocessing-files"; then
    print_success "S3 bucket exists."
  else
    print_error "S3 bucket not found!"
    
    print_status "Attempting to create S3 bucket..."
    docker exec whisper-localstack awslocal s3 mb s3://whisperprocessing-files
  fi
  
  # Check SQS queue
  if docker exec whisper-localstack awslocal sqs get-queue-url --queue-name whisperprocessing-whisper-jobs >/dev/null 2>&1; then
    print_success "SQS queue exists."
  else
    print_error "SQS queue not found!"
    
    print_status "Attempting to create SQS queue..."
    docker exec whisper-localstack awslocal sqs create-queue --queue-name whisperprocessing-whisper-jobs
  fi
}

# Function to reset everything
reset_whisper() {
  print_status "Resetting Whisper environment..."
  
  print_status "Stopping and removing containers..."
  docker-compose down
  
  print_status "Removing temporary LocalStack data..."
  rm -rf /tmp/localstack
  
  print_status "Reset complete."
}

# Main script execution
case "$1" in
  start)
    check_env && start_whisper
    ;;
    
  verify)
    verify_resources
    ;;
    
  logs)
    docker-compose logs -f
    ;;
    
  reset)
    reset_whisper
    ;;
    
  *)
    echo "Usage: $0 {start|verify|logs|reset}"
    echo ""
    echo "  start    - Start Whisper services"
    echo "  verify   - Verify AWS resources are properly set up"
    echo "  logs     - Show logs from all containers"
    echo "  reset    - Stop services and clean up"
    exit 1
    ;;
esac

exit 0 