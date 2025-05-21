const { Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const cloudfrontOrigins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const iam = require('aws-cdk-lib/aws-iam');

/**
 * Creates infrastructure components for the landing page
 * 
 * @param {import('aws-cdk-lib').Stack} stack The parent stack
 * @param {Object} props The props
 * @param {Object} resources The shared resources (certificates, logging bucket, etc.)
 * @returns {Object} The created resources
 */
function createLandingPage(stack, props = {}, resources = {}) {
  const { domainName, hostedZone, certificate, loggingBucket, enableLogging = false } = resources;
  
  // ========= LANDING PAGE =========
  // Landing page bucket
  const landingBucket = new s3.Bucket(stack, 'LandingBucket', {
    bucketName: `${domainName}-landing`,
    publicReadAccess: false,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    cors: [
      {
        allowedMethods: [s3.HttpMethods.GET],
        allowedOrigins: [`https://${domainName}`, `https://www.${domainName}`],
        allowedHeaders: ['*'],
        maxAge: 3000
      }
    ]
  });

  // Create Origin Access Control for CloudFront to access S3
  const cloudFrontOAC = new cloudfront.CfnOriginAccessControl(stack, 'CloudFrontOAC', {
    originAccessControlConfig: {
      name: 'CloudFrontOAC',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
      originAccessControlOriginType: 's3',
    }
  });
  
  // Create S3 origin for CloudFront with OAC
  const cfnS3Origin = new cloudfrontOrigins.S3Origin(landingBucket, {
    originAccessControl: cloudFrontOAC
  });
  
  // Create a CloudFront distribution with OAC
  const landingDistribution = new cloudfront.Distribution(stack, 'LandingDistributionV2', {
    defaultBehavior: {
      origin: cfnS3Origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    },
    domainNames: [domainName, `www.${domainName}`],
    certificate: certificate,
    defaultRootObject: 'index.html',
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10)
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10)
      }
    ],
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use cheaper US/Europe price class
    enableLogging: enableLogging,
    // logBucket: loggingBucket, // Comment out log bucket
    // logFilePrefix: 'landing/', // Comment out log prefix
    // logIncludesCookies: false,
    httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
  });

  // Update bucket policy to allow CloudFront to access the S3 bucket using OAC
  landingBucket.addToResourcePolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [landingBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${stack.account}:distribution/${landingDistribution.distributionId}`
        }
      }
    })
  );

  // Deploy content to S3, with fallback to ensure there's always an index.html
  try {
    new s3deploy.BucketDeployment(stack, 'LandingDeployment', {
      sources: [
        s3deploy.Source.asset('../landing/out', {
          // If the directory doesn't exist, this will create a placeholder
          fallback: s3deploy.Source.data('index.html', 
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>East Medical AI</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                  color: #333;
                }
                .container {
                  max-width: 800px;
                  text-align: center;
                  padding: 2rem;
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  font-size: 2.5rem;
                  margin-bottom: 1rem;
                  color: #2c3e50;
                }
                p {
                  font-size: 1.2rem;
                  line-height: 1.6;
                  color: #555;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>East Medical AI</h1>
                <p>Welcome to our landing page! Our site is currently under construction.</p>
                <p>We're working on bringing you innovative healthcare AI solutions.</p>
                <p>Please check back soon for updates.</p>
              </div>
            </body>
            </html>`
          )
        })
      ],
      destinationBucket: landingBucket,
      distribution: landingDistribution,
      distributionPaths: ['/*'],
      prune: true
    });
  } catch (error) {
    // Fallback if there was an issue with the first deployment attempt
    console.log('Falling back to placeholder index.html');
    new s3deploy.BucketDeployment(stack, 'LandingDeploymentFallback', {
      sources: [
        s3deploy.Source.data('index.html', 
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>East Medical AI</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                color: #333;
              }
              .container {
                max-width: 800px;
                text-align: center;
                padding: 2rem;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              }
              h1 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
                color: #2c3e50;
              }
              p {
                font-size: 1.2rem;
                line-height: 1.6;
                color: #555;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>East Medical AI</h1>
              <p>Welcome to our landing page! Our site is currently under construction.</p>
              <p>We're working on bringing you innovative healthcare AI solutions.</p>
              <p>Please check back soon for updates.</p>
            </div>
          </body>
          </html>`
        )
      ],
      destinationBucket: landingBucket,
      distribution: landingDistribution,
      distributionPaths: ['/*'],
      prune: false
    });
  }

  // Create Route53 record for landing page
  new route53.ARecord(stack, 'LandingARecord', {
    zone: hostedZone,
    target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(landingDistribution)),
    recordName: domainName
  });

  // Create Route53 record for www subdomain
  new route53.ARecord(stack, 'LandingWWWARecord', {
    zone: hostedZone,
    target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(landingDistribution)),
    recordName: `www.${domainName}`
  });

  // Add outputs for landing page URL
  new CfnOutput(stack, 'LandingURL', {
    value: `https://${domainName}`,
    description: 'Landing page URL'
  });

  return {
    landingBucket,
    landingDistribution
  };
}

module.exports = { createLandingPage }; 