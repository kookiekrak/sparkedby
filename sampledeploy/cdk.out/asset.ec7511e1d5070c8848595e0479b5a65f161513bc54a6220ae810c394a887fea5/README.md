# Whisper Worker

A modular service for transcribing audio files using OpenAI's Whisper API and forwarding the transcription to a backend API.

## Project Structure

```
whisper/
├── app.py                  # Main application entry point
├── app_legacy.py           # Legacy monolithic application (kept for reference)
├── requirements.txt        # Project dependencies
└── src/
    ├── config/             # Configuration modules
    │   ├── aws.py          # AWS client initialization
    │   ├── logging.py      # Logging setup
    │   └── secrets.py      # Secret management
    ├── services/           # Core service modules
    │   ├── audio.py        # Audio processing
    │   ├── message_processor.py  # SQS message handling
    │   └── transcription.py     # Transcription service
    └── utils/              # Utility modules
        └── signal_handlers.py   # Graceful shutdown handlers
```

## Setup

1. Install dependencies:
   ```bash
   cd whisper
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the project root with the following variables:

   **Required variables:**
   ```
   OPENAI_API_KEY=your_openai_api_key
   API_TOKEN=your_api_token
   ```

   **Optional variables (with defaults):**
   ```
   API_URL=http://localhost:3000  # Default if not specified
   ENVIRONMENT=development        # Use 'production' to switch to AWS Secrets Manager
   AWS_REGION=us-east-2           # AWS region for S3 and SQS
   ```

   **For local SQS and S3 testing:**
   ```
   WHISPER_QUEUE_URL_DEV=your_dev_queue_url
   S3_BUCKET_NAME=whisperprocessing-files
   ```

3. Ensure AWS credentials are properly configured if you need to access AWS services locally.

## Running the Service

```bash
cd whisper
python app.py
```

## Development

This project has been refactored from a monolithic architecture to a more modular, maintainable structure. Each component is now separated into its own module with clear responsibilities:

- **Config**: Handles application configuration, secrets, and AWS setup
- **Services**: Contains core business logic
- **Utils**: Helper functions and utilities

The main entry point coordinates these modules and runs the message processing loop.

## Testing

Tests will be added in a future update to verify each module's functionality.

## Deployment

For production deployment, ensure the following:

1. Set `ENVIRONMENT=production` in your environment
2. Configure AWS credentials for the account where the SQS queue and S3 bucket are located
3. Create the secret `whisperworker` in AWS Secrets Manager with the following keys:
   - `OPENAI_API_KEY`
   - `API_TOKEN`
   - `API_URL`

## Docker Compose Setup

This project includes a Docker Compose configuration for running the Whisper service alongside a Localstack instance that provides S3 and SQS services for local development.

### Prerequisites

- Docker and Docker Compose installed on your system
- OpenAI API key (set in your environment or .env file)

### Running with Docker Compose

1. Start the Docker Compose environment:
   ```bash
   docker-compose up
   ```

2. The following services will be available:
   - Whisper application running in a container
   - Localstack with S3 and SQS services on port 4566

### Service URLs for Integration

When the Docker Compose stack is running, you can use these URLs in your API and UI projects:

- **S3 Bucket URL**: `http://localhost:4566/whisperprocessing-files`
- **SQS Queue URL**: `http://localhost:4566/000000000000/whisperprocessing-whisper-jobs`

### Environment Variables for Other Projects

Add these environment variables to your API and UI projects to connect to the local services:

```
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=whisperprocessing-files
WHISPER_QUEUE_URL=http://localhost:4566/000000000000/whisperprocessing-whisper-jobs
```

### Stopping the Services

To stop the services, use:
```bash
docker-compose down
```

### Troubleshooting

If you encounter issues with the SQS queue not being available when the whisper app starts, this could be because:

1. **Service Initialization Timing**: The Docker Compose setup includes health checks and dependencies, but sometimes the LocalStack SQS service might not be fully ready when the whisper app tries to connect.

2. **Queue Creation Issues**: The initialization script may not have successfully created the queue.

#### Solutions

The architecture includes several mechanisms to handle this:

1. **Health Checks**: The LocalStack container has a health check that verifies the service is ready before starting dependent services.

2. **Startup Script**: The whisper app uses a startup script (`start-app.sh`) that waits for the SQS queue to be available before starting the application.

3. **Dedicated Setup Container**: A separate `localstack-setup` container is included specifically to initialize the services after LocalStack is fully ready. This container has its own health check that ensures initialization is complete before other services start.

4. **Robust Initialization**: The initialization script includes retries and explicit validation to ensure services are properly created and accessible.

#### If You Still See Issues

If you still encounter errors related to services not being available:

1. **Force Rebuild**: Try completely rebuilding the containers:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

2. **Check Logs**: Examine each service's logs for clues:
   ```bash
   docker-compose logs localstack
   docker-compose logs localstack-setup
   docker-compose logs whisper-app
   ```

3. **Manual Queue Creation**: If needed, you can manually create the queue:
   ```bash
   docker exec -it whisper-localstack-1 bash
   awslocal sqs create-queue --queue-name whisperprocessing-whisper-jobs
   ```

4. **Verify Service Status**: Check the status of the services:
   ```bash
   curl http://localhost:4566/_localstack/health
   ```

5. **Inspect the Queue**: Check if the queue exists:
   ```bash
   aws --endpoint-url=http://localhost:4566 sqs list-queues
   ```
