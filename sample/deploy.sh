#!/bin/bash

# SparkedBy Client Landing Page Deployment Script
# This script deploys the landing page to a client-specific subdomain

# Check if CLIENT_NAME is provided
if [ -z "$CLIENT_NAME" ]; then
  echo "Error: CLIENT_NAME environment variable is required"
  echo "Usage: CLIENT_NAME=yourbusiness npm run deploy:client"
  exit 1
fi

# Build the project
echo "Building landing page for $CLIENT_NAME..."
npm run build

# Deploy to client subdomain
echo "Deploying to $CLIENT_NAME.sparkedby.app..."

# You would put your actual deployment commands here
# For example:
# aws s3 sync dist/ s3://$CLIENT_NAME.sparkedby.app/ --delete
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete! Your landing page is available at:"
echo "https://$CLIENT_NAME.sparkedby.app"
