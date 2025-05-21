# Use Python 3.12 and specify platform
FROM --platform=linux/amd64 python:3.12-slim as build

# Install system dependencies and clean up in the same layer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# Set up working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY .env .
COPY start-app.sh .
COPY src/ ./src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV AWS_DEFAULT_REGION=us-east-1

# Create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app
USER appuser

# Use different commands based on environment
CMD if [ "$ENVIRONMENT" = "development" ]; then \
      chmod +x start-app.sh && ./start-app.sh; \
    else \
      python3 app.py; \
    fi
