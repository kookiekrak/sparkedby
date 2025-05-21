#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { SparkedByLandingStack } = require('./lib/landing-stack');
const { SubdomainLandingStack } = require('./lib/subdomain-landing-stack');
const { CertificateStack } = require('./lib/certificate-stack');

// Common configuration
const domainName = 'sparkedby.app';
const wwwDomainName = `www.${domainName}`;

// Main website bucket name
const mainBucketName = 'sparkedby-app';

// Certificate ARNs and Hosted Zone ID
// Current certificate - keep this for the main landing page
const mainCertificateArn = 'arn:aws:acm:us-east-1:302263086944:certificate/5455dc07-d24f-4dd9-98ff-08bcfdc8fade';
// Wildcard certificate ARN created for client subdomains (*.sparkedby.app)
const wildcardCertificateArn = process.env.WILDCARD_CERT_ARN || 'arn:aws:acm:us-east-1:302263086944:certificate/0893128a-ab57-440a-b133-3a663913c5c8';
const hostedZoneId = 'Z03642041RUIUCIHW4W1W';

// To deploy a client subdomain, set these values
// For example, 'acme' would create acme.sparkedby.app
const clientName = process.env.CLIENT_NAME || ''; // Command-line override: CLIENT_NAME=acme npm run deploy:client

const app = new cdk.App();

// Create the wildcard certificate stack in us-east-1 (required for CloudFront)
new CertificateStack(app, 'SparkedByWildcardCertStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' // ACM certificates for CloudFront must be in us-east-1
  },
  domainName: domainName,
  tags: {
    Project: 'SparkedBy',
    Environment: 'Production',
  }
});

// Create the landing page stack in the default region
new SparkedByLandingStack(app, 'SparkedByLandingStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2'
  },
  certificateArn: mainCertificateArn,
  hostedZoneId: hostedZoneId,
  domainName: domainName,
  wwwDomainName: wwwDomainName,
  bucketName: mainBucketName,
  tags: {
    Project: 'SparkedBy',
    Environment: 'Production',
  }
});

// Create a client-specific landing page stack if clientName is provided
if (clientName) {
  const clientStackId = `SparkedByClient${clientName.charAt(0).toUpperCase() + clientName.slice(1)}Stack`;
  
  new SubdomainLandingStack(app, clientStackId, {
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION || 'us-east-2'
    },
    certificateArn: wildcardCertificateArn || mainCertificateArn, // Fall back to main certificate if wildcard not yet created
    hostedZoneId: hostedZoneId,
    domainName: domainName,
    clientName: clientName,
    tags: {
      Project: 'SparkedBy',
      Environment: 'Production',
      Client: clientName
    }
  });
  
  console.log(`Creating landing page for client: ${clientName}.${domainName}`);
}

app.synth();
