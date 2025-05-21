const cdk = require('aws-cdk-lib');
const { RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const fs = require('fs');
const path = require('path');

/**
 * Stack for creating a wildcard CloudFront distribution that serves all client subdomains
 * This allows for instant deployment of new client sites without waiting for CloudFront provisioning
 */
class WildcardLandingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get required properties
    const domainName = props.domainName;           // sparkedby.app
    const certificateArn = props.certificateArn;   // ARN of the wildcard certificate
    const hostedZoneId = props.hostedZoneId;       // Route53 hosted zone ID
    
    // Import the wildcard certificate (already created in us-east-1)
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'WildcardCertificate',
      certificateArn
    );
    
    // Import the Route53 hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: domainName,
      hostedZoneId: hostedZoneId,
    });
    
    // Create an S3 bucket for user-generated content
    const defaultBucket = new s3.Bucket(this, 'UserContentBucket', {
      bucketName: `sparkedby-user-files`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: RemovalPolicy.RETAIN
    });
    
    // CloudFront functions have limitations - let's use a simpler approach
    // Instead of trying to modify the origin, we'll rewrite the path to include the subdomain
    const simpleSubdomainFunction = new cloudfront.Function(this, 'SubdomainPathFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var host = request.headers.host.value;
          
          // Extract the subdomain from the host header
          var subdomain = host.split('.')[0];
          
          // Add subdomain to beginning of path if there's a path
          if (request.uri === '/') {
            request.uri = '/' + subdomain + '/index.html';
          } else if (!request.uri.startsWith('/' + subdomain + '/')) {
            request.uri = '/' + subdomain + request.uri;
          }
          
          return request;
        }
      `)
    });
    
    // Create the wildcard CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WildcardDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [`*.${domainName}`],  // Wildcard domain
      certificate: certificate,
      defaultBehavior: {
        origin: new origins.S3Origin(defaultBucket),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(this, 'NoCachePolicy', {
          defaultTtl: cdk.Duration.seconds(0),
          minTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.seconds(1),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          comment: 'No caching for rapid development iterations',
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Origin'),
        }),
        functionAssociations: [
          {
            function: simpleSubdomainFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
          }
        ]
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
    
    // Create the wildcard DNS record
    new route53.ARecord(this, 'WildcardRecord', {
      zone: hostedZone,
      recordName: `*.${domainName}`,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
    });
    
    // Output the distribution ID
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'The ID of the wildcard CloudFront distribution'
    });
    
    // Output instructions for creating new client sites
    new cdk.CfnOutput(this, 'DeploymentInstructions', {
      value: `To deploy a new client site:
      1. Create an S3 bucket named: CLIENT_NAME-sparkedby-app
      2. Configure it for website hosting with index.html as index and error document
      3. Upload your static files
      4. Site will be available at CLIENT_NAME.${domainName}`,
      description: 'Instructions for deploying new client sites'
    });
  }
}

module.exports = { WildcardLandingStack };
