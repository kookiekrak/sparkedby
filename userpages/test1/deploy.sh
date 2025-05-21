#!/bin/bash

# FriendSplit Landing Page Deployment Script
# This script builds and deploys to the central bucket with subfolder organization

# Set client name to friend-split
CLIENT_NAME="friend-split"
# Use the user files bucket for all client sites
BUCKET_NAME="sparkedby-user-files"
echo "Setting up deployment for $CLIENT_NAME.sparkedby.app..."

# Build the project
echo "Building landing page for $CLIENT_NAME..."
npm run build

# The bucket should already exist as part of the wildcard CloudFront stack
# If it doesn't exist yet, we'll create it
echo "Checking for centralized client sites bucket $BUCKET_NAME..."
aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null || \
  aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1

# Upload files to S3 in client-specific subfolder
echo "Uploading files to S3 subfolder $CLIENT_NAME/..."
aws s3 sync dist/ "s3://$BUCKET_NAME/$CLIENT_NAME/" --delete

echo "Deployment complete! Your landing page is available at:"
echo "https://$CLIENT_NAME.sparkedby.app/"
echo "(Once the wildcard CloudFront distribution has been deployed)"
echo ""
echo "To test your site, run: npm run deploy:wildcard"
echo "This only needs to be done once for all client sites."
