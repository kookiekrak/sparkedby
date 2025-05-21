const cdk = require('aws-cdk-lib');
const { RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const path = require('path');

/**
 * Stack for creating a subdomain landing page (e.g., clientname.sparkedby.app)
 * This is designed to be instantiated multiple times for different clients
 */
class SubdomainLandingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get required properties
    const domainName = props.domainName;         // sparkedby.app
    const clientName = props.clientName;         // e.g., "acme" for acme.sparkedby.app
    const certificateArn = props.certificateArn; // ARN of the wildcard certificate
    const hostedZoneId = props.hostedZoneId;     // Route53 hosted zone ID
    
    // Define the full subdomain
    const subdomain = `${clientName}.${domainName}`;
    
    // Define the S3 bucket name
    const bucketName = `${clientName}-${domainName.replace(/\./g, '-')}`;
    
    // Import the wildcard certificate (already created in us-east-1)
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'ImportedCertificate',
      certificateArn
    );
    
    // Import the Route53 hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: domainName,
      hostedZoneId: hostedZoneId,
    });
    
    // Create an S3 bucket for this client's landing page
    const websiteBucket = new s3.Bucket(this, 'ClientLandingBucket', {
      bucketName: bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true, // Required for website hosting
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    
    // Create a CloudFront distribution for this client
    const distribution = new cloudfront.Distribution(this, 'ClientDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [subdomain],
      certificate: certificate,
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(10),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(10),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });
    
    // Create the subdomain DNS record
    new route53.ARecord(this, 'SubdomainRecord', {
      zone: hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
    });
    
    // Deploy content to the S3 bucket
    // You can override the source path in props
    const contentPath = props.contentPath || path.join(__dirname, '../../landing/dist');
    new s3deploy.BucketDeployment(this, 'DeployLandingPage', {
      sources: [s3deploy.Source.asset(contentPath)],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*']
    });
    
    // Output the subdomain URL
    new cdk.CfnOutput(this, 'SubdomainUrl', {
      value: `https://${subdomain}`,
      description: `URL for the ${clientName} landing page`,
    });
    
    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: `CloudFront URL for the ${clientName} landing page`,
    });
    
    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucketName,
      description: `S3 bucket for the ${clientName} landing page`,
    });
  }
}

module.exports = { SubdomainLandingStack };
