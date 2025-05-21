#!/bin/bash

echo "Starting Whisper application in production mode..."

# Basic AWS connectivity check (using IAM role)
echo "Verifying AWS connectivity..."
if aws sts get-caller-identity >/dev/null 2>&1; then
    echo "✅ AWS connectivity verified"
else
    echo "❌ Failed to verify AWS connectivity"
    exit 1
fi

echo "Starting Whisper application..."
exec python3 app.py 