const { Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const route53 = require('aws-cdk-lib/aws-route53');
const route53Targets = require('aws-cdk-lib/aws-route53-targets');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const path = require('path');
const fs = require('fs');
const { DockerImage } = require('aws-cdk-lib');

function createAPI(stack, props = {}, resources = {}) {
  const { domainName, hostedZone, regionalCertificate, certificate } = resources;
  
  // Use the regional certificate specifically for API Gateway, fall back to the main certificate only if necessary
  const apiCertificate = regionalCertificate || certificate;
  
  if (!apiCertificate) {
    throw new Error('No certificate provided for API domain name. Please ensure either regionalCertificate or certificate is passed.');
  }

  // Add more logging to understand certificate issues during deployment
  console.log(`API Certificate ARN: ${apiCertificate.certificateArn}`);
  console.log(`API Stack Region: ${stack.region}`);
  console.log(`API Domain Name: api.${domainName}`);

  // Add a stack identifier output with the correct stack name
  new CfnOutput(stack, 'APIStackIdentifier', {
    value: 'WhisperProcessingStack',
    description: 'Identifier for the WhisperProcessing stack that contains API components'
  });

  // Create a Secrets Manager secret for all app credentials
  const appSecret = new secretsmanager.Secret(stack, 'AppCredentials', {
    secretName: 'app-credentials',
    description: 'Credentials for the application',
    generateSecretString: {
      secretStringTemplate: JSON.stringify({
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_KEY: process.env.SUPABASE_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        API_TOKEN: process.env.API_TOKEN || ''
      }),
      generateStringKey: 'dummy' // Required but not used
    }
  });

  // API Lambda function with simplified bundling
  const apiFunction = new lambda.Function(stack, 'APIFunction', {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('../api', {
      bundling: {
        // Add local bundling option
        local: {
          tryBundle(outputDir) {
            try {
              const { execSync } = require('child_process');
              const path = require('path');
              
              // Get path to local esbuild
              const esbuildPath = path.resolve(__dirname, '../../../api/node_modules/.bin/esbuild');
              const apiPath = path.resolve(__dirname, '../../../api');
              
              // Create output directory
              execSync(`mkdir -p ${outputDir}`);
              
              // Bundle with esbuild using local path
              execSync(`${esbuildPath} --bundle src/index.ts --platform=node --target=node20 --outfile=${outputDir}/index.js --external:aws-sdk --external:@aws-sdk/* --external:express --external:cors --external:multer --external:@vendia/serverless-express --format=cjs --sourcemap`, {
                cwd: apiPath
              });
              
              // Copy package files
              execSync(`cp package.json ${outputDir}/`, {
                cwd: apiPath
              });
              execSync(`cp yarn.lock ${outputDir}/`, {
                cwd: apiPath
              });
              
              // Install production dependencies
              execSync('yarn install --production --ignore-scripts', {
                cwd: outputDir
              });
              
              // Create tmp directory
              execSync(`mkdir -p ${outputDir}/tmp`);
              
              return true;
            } catch (error) {
              console.error('Local bundling failed:', error);
              return false;
            }
          }
        },
        // Keep existing Docker configuration as fallback
        image: DockerImage.fromRegistry('node:20-slim'),
        command: [
          'bash', '-c', [
            'yarn global add esbuild',
            'mkdir -p /asset-output',
            'esbuild --bundle /asset-input/src/index.ts --platform=node --target=node20 --outfile=/asset-output/index.js --external:aws-sdk --external:@aws-sdk/* --external:express --external:cors --external:multer --external:@vendia/serverless-express --format=cjs --sourcemap',
            'cp /asset-input/package.json /asset-output/',
            'cp /asset-input/yarn.lock /asset-output/',
            'cd /asset-output && yarn install --production --ignore-scripts',
            'mkdir -p /asset-output/tmp',
            'echo "API asset bundling complete"'
          ].join(' && ')
        ],
        environment: {
          NODE_ENV: 'production'
        }
      }
    }),
    memorySize: 1536,
    timeout: Duration.minutes(5),
    environment: {
      NODE_ENV: 'production',
      S3_BUCKET_NAME: resources.audioBucket?.bucketName,
      WHISPER_QUEUE_URL: resources.whisperQueue?.queueUrl,
      APP_SECRET_ARN: appSecret.secretArn,
    },
    logRetention: logs.RetentionDays.ONE_WEEK,
    architecture: lambda.Architecture.ARM_64,
    description: 'Lambda function serving the API',
    tracing: lambda.Tracing.ACTIVE,
  });

  // Grant the Lambda function permission to read the app secret
  appSecret.grantRead(apiFunction);

  // Grant necessary permissions to API Lambda
  if (resources.audioBucket) {
    resources.audioBucket.grantReadWrite(apiFunction);
  }
  if (resources.whisperQueue) {
    resources.whisperQueue.grantSendMessages(apiFunction);
  }

  // Create Log Group for API Lambda
  const apiLogGroup = new logs.LogGroup(stack, 'ApiLogGroup', {
    logGroupName: `/aws/lambda/${apiFunction.functionName}`,
    retention: logs.RetentionDays.ONE_WEEK,
    removalPolicy: RemovalPolicy.DESTROY
  });

  // API Gateway with better configuration
  const api = new apigateway.RestApi(stack, 'API', {
    restApiName: 'EastMedical API',
    domainName: {
      domainName: `api.${domainName}`,
      certificate: apiCertificate,
    },
    defaultCorsPreflightOptions: {
      allowOrigins: [
        `https://${domainName}`,
        `https://app.${domainName}`,
        'http://localhost:3000',
        'http://localhost:5173'
      ],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Date',
        'X-Amz-Security-Token'
      ],
      allowCredentials: true
    },
    deployOptions: {
      stageName: 'prod',
      dataTraceEnabled: true,
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      metricsEnabled: true,
    }
  });

  // Add proxy integration to API Gateway
  const integration = new apigateway.LambdaIntegration(apiFunction, {
    proxy: true,
    allowTestInvoke: true,
    timeout: Duration.seconds(29),
    integrationResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        }
      },
      {
        selectionPattern: '.*ERROR.*',
        statusCode: '500',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        }
      }
    ]
  });

  // Add resources and methods
  const apiRoot = api.root.addProxy({
    defaultIntegration: integration,
    anyMethod: true,
    defaultMethodOptions: {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    }
  });

  // Add CloudWatch alarms for API errors
  const apiErrors = new cloudwatch.Metric({
    namespace: 'AWS/ApiGateway',
    metricName: '5XXError',
    dimensionsMap: {
      ApiName: api.restApiName,
      Stage: 'prod'
    },
    period: Duration.minutes(5),
    statistic: 'sum'
  });

  new cloudwatch.Alarm(stack, 'ApiErrorAlarm', {
    metric: apiErrors,
    threshold: 5,
    evaluationPeriods: 1,
    alarmDescription: 'API has high error rate',
    actionsEnabled: true
  });

  // Route53 record for API
  new route53.ARecord(stack, 'APIARecord', {
    zone: hostedZone,
    target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api)),
    recordName: `api.${domainName}`
  });

  return {
    apiFunction,
    api,
    apiLogGroup
  };
}

module.exports = { createAPI }; 