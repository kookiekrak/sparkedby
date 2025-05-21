/**
 * Configuration for the SparkedBy landing page infrastructure
 * 
 * Note: Before deployment:
 * 1. Create an ACM certificate in us-east-1 for your domain (required for CloudFront)
 * 2. Ensure your Route53 hosted zone is properly set up
 * 3. Update the certificateArn and hostedZoneId below
 */

// Get stack type from STACK_TYPE environment variable
const stackType = process.env.STACK_TYPE || 'cert';

/**
 * Get configuration for certificate stack
 */
function getCertConfig() {
  return {
    // Domain configuration
    domainName: 'sparkedby.app',
    
    // Region configuration (always us-east-1 for CloudFront certificates)
    region: 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT
  };
}

/**
 * Get configuration for landing page stack
 * After deploying the certificate stack, update certificateArn and hostedZoneId
 * with the values from the certificate stack's outputs
 */
function getLandingConfig() {
  return {
    // Domain configuration
    domainName: 'sparkedby.app',
    wwwDomainName: 'www.sparkedby.app',
    
    // Certificate configuration - replace with actual ARN after certificate deployment
    certificateArn: 'arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERTIFICATE_ID',
    
    // Route53 configuration - replace with actual hosted zone ID after certificate deployment
    hostedZoneId: 'YOUR_HOSTED_ZONE_ID',
    
    // S3 bucket name for landing page
    bucketName: 'sparkedby-landing-page',
    
    // CloudFront configuration
    enableLogging: false,
    
    // Region configuration
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT
  };
}

/**
 * Get configuration based on stack type
 */
function getConfig() {
  if (stackType === 'cert') {
    return getCertConfig();
  } else if (stackType === 'landing') {
    return getLandingConfig();
  } else {
    throw new Error(`Unknown stack type: ${stackType}. Use STACK_TYPE=cert or STACK_TYPE=landing`);
  }
}

module.exports = { getConfig };
