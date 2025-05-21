const { Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const cloudfrontOrigins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const iam = require('aws-cdk-lib/aws-iam');

function createUIApp(stack, props = {}, resources = {}) {
  const { domainName, hostedZone, certificate, loggingBucket, cloudFrontOAC, enableLogging = false } = resources;

  // UI bucket
  const uiBucket = new s3.Bucket(stack, 'UIBucket', {
    bucketName: `${domainName}-ui`,
    publicReadAccess: false,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    cors: [
      {
        allowedMethods: [s3.HttpMethods.GET],
        allowedOrigins: [`https://app.${domainName}`],
        allowedHeaders: ['*'],
        maxAge: 3000
      }
    ]
  });

  // Create S3 origin for CloudFront with OAC
  const cfnS3Origin = new cloudfrontOrigins.S3Origin(uiBucket, {
    originAccessControl: cloudFrontOAC
  });

  // CloudFront distribution for UI
  const uiDistribution = new cloudfront.Distribution(stack, 'UIDistribution', {
    defaultBehavior: {
      origin: cfnS3Origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      cachePolicy: new cloudfront.CachePolicy(stack, 'UICachePolicy', {
        defaultTtl: Duration.hours(1),
        minTtl: Duration.minutes(5),
        maxTtl: Duration.days(1),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization'),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      }),
    },
    domainNames: [`app.${domainName}`],
    certificate: certificate,
    defaultRootObject: 'index.html',
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      }
    ],
    enableLogging: enableLogging,
    logBucket: loggingBucket,
    logFilePrefix: 'ui/',
    logIncludesCookies: false,
    httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
  });

  // Add bucket policy to allow CloudFront to access the S3 bucket using OAC
  uiBucket.addToResourcePolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [uiBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${stack.account}:distribution/${uiDistribution.distributionId}`
        }
      }
    })
  );

  // Deploy UI content with environment variables
  new s3deploy.BucketDeployment(stack, 'UIDeployment', {
    sources: [
      s3deploy.Source.asset('../ui/dist', {
        exclude: ['.git'],
      })
    ],
    destinationBucket: uiBucket,
    distribution: uiDistribution,
    distributionPaths: ['/*'],
    prune: true,
    memoryLimit: 1024
  });

  // Route53 record for UI
  new route53.ARecord(stack, 'UIARecord', {
    zone: hostedZone,
    target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(uiDistribution)),
    recordName: `app.${domainName}`
  });

  return {
    uiBucket,
    uiDistribution
  };
}

module.exports = { createUIApp }; 