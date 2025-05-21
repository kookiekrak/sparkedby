const cdk = require('aws-cdk-lib');
const { RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');

class SparkedByLandingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get properties from props
    const domainName = props.domainName;
    const wwwDomainName = props.wwwDomainName || `www.${domainName}`;
    const bucketName = props.bucketName || `${domainName.replace(/\./g, '-')}-website`;

    // Import the certificate from us-east-1 using the certificate ARN from props
    // This certificate is created by the certificate stack in us-east-1 region
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'ImportedCertificate',
      props.certificateArn
    );
    
    // Import the Route53 hosted zone using the ID from props
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: domainName,
      hostedZoneId: props.hostedZoneId,
    });
    
    // Create a new S3 bucket that's properly configured for website hosting
    const websiteBucket = new s3.Bucket(this, 'SparkedByWebsiteBucket', {
      bucketName: bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true, // Essential for website hosting
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: RemovalPolicy.DESTROY, // For easy cleanup during development
      autoDeleteObjects: true
    });

    // Create a CloudFront distribution with the website endpoint
    const distribution = new cloudfront.Distribution(this, 'LandingPageDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwDomainName],
      certificate: certificate,
      defaultBehavior: {
        // Use the website endpoint for the bucket
        origin: new origins.S3Origin(websiteBucket, {
          originPath: ''
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 403, // Access Denied errors
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(10),
        },
        {
          httpStatus: 404, // Not Found errors
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(10),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
    });

    // No manual overrides needed with OAI
    
    // Deploy the website content to the S3 bucket with a simpler configuration
    // This avoids issues with bucket deletion/recreation
    new s3deploy.BucketDeployment(this, 'DeployLandingPage', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../landing/dist'))],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*']
    });

    // Create Route 53 alias records for the CloudFront distribution
    new route53.ARecord(this, 'ApexAliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
    });

    new route53.ARecord(this, 'WwwAliasRecord', {
      zone: hostedZone,
      recordName: wwwDomainName,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
    });

    // Output the URLs
    new cdk.CfnOutput(this, 'ApexSiteUrl', {
      value: `https://${domainName}`,
      description: 'URL for the SparkedBy landing page (apex domain)',
    });

    new cdk.CfnOutput(this, 'WwwSiteUrl', {
      value: `https://${wwwDomainName}`,
      description: 'URL for the SparkedBy landing page (www)',
    });
    
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for the SparkedBy landing page',
    });
  }
}

module.exports = { SparkedByLandingStack };
