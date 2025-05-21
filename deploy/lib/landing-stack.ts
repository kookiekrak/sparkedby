import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';

export class SparkedByLandingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket to host the static website
    const websiteBucket = new s3.Bucket(this, 'LandingPageBucket', {
      bucketName: 'sparkedby-landing-page',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA fallback
      publicReadAccess: false, // We'll use CloudFront to access the content
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect against accidental deletion
      autoDeleteObjects: false,
    });

    // CloudFront Origin Access Identity to access the private S3 bucket
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: 'OAI for SparkedBy landing page',
    });

    // Grant the OAI read access to the bucket
    websiteBucket.grantRead(cloudfrontOAI);

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'LandingPageDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: cloudfrontOAI,
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
    });

    // Deploy the website content to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployLandingPage', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../landing/dist'))],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'LandingPageUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'URL for the SparkedBy landing page',
    });
  }
}
