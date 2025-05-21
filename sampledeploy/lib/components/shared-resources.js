const { Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const route53 = require('aws-cdk-lib/aws-route53');
const iam = require('aws-cdk-lib/aws-iam');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const ec2 = require('aws-cdk-lib/aws-ec2');
const logs = require('aws-cdk-lib/aws-logs');

/**
 * Creates shared infrastructure resources used by multiple components
 * 
 * @param {import('aws-cdk-lib').Stack} stack The parent stack
 * @param {Object} props The props
 * @returns {Object} The created resources
 */
function createSharedResources(stack, props = {}) {
  // Domain configuration
  const baseDomain = props.baseDomain || 'eastmedical.ai';
  const domainName = props.domainName || baseDomain;
  
  // Use Route53 Zone directly with ID instead of lookup
  const hostedZone = route53.HostedZone.fromHostedZoneAttributes(stack, 'SharedHostedZone', {
    zoneName: baseDomain,
    hostedZoneId: props.hostedZoneId || process.env.HOSTED_ZONE_ID || 'Z055778020D8NH7RP81J5',
  });

  // Create regional certificate for API Gateway
  const regionalCertificate = new acm.Certificate(stack, 'RegionalCertificate', {
    domainName: `api.${domainName}`,
    validation: acm.CertificateValidation.fromDns(hostedZone),
  });

  // Create log group for VPC Flow Logs
  const flowLogGroup = new logs.LogGroup(stack, 'VpcFlowLogsGroup', {
    retention: logs.RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.RETAIN,
  });

  // Create a shared VPC for all services
  const vpc = new ec2.Vpc(stack, 'SharedVpc', {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: 'private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
      {
        name: 'isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 28,
      }
    ]
  });
  
  // Apply a removal policy to protect the VPC from accidental deletion
  const cfnVpc = vpc.node.defaultChild;
  cfnVpc.applyRemovalPolicy(RemovalPolicy.RETAIN);

  // Enable VPC Flow Logs to CloudWatch
  vpc.addFlowLog('FlowLog', {
    destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
    trafficType: ec2.FlowLogTrafficType.ALL,
    flowLogName: 'VpcTrafficMonitoring',
    maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE
  });

  // Gateway endpoints (free)
  const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
    service: ec2.GatewayVpcEndpointAwsService.S3
  });

  const dynamoEndpoint = vpc.addGatewayEndpoint('DynamoEndpoint', {
    service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
  });

  // Interface endpoints (paid, but reduce NAT costs)
  // Container-related endpoints
  vpc.addInterfaceEndpoint('EcrEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.ECR,
    privateDnsEnabled: true
  });

  vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    privateDnsEnabled: true
  });

  // Monitoring and logging endpoints
  vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH,
    privateDnsEnabled: true
  });

  vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    privateDnsEnabled: true
  });

  // Security and messaging endpoints
  vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    privateDnsEnabled: true
  });

  vpc.addInterfaceEndpoint('SQSEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.SQS,
    privateDnsEnabled: true
  });

  // Systems Manager endpoint for ECS exec and parameter store
  vpc.addInterfaceEndpoint('SSMEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.SSM,
    privateDnsEnabled: true
  });

  vpc.addInterfaceEndpoint('SSMMessagesEndpoint', {
    service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    privateDnsEnabled: true
  });

  // Create Origin Access Control for CloudFront with a unique name
  const cloudFrontOAC = new cloudfront.CfnOriginAccessControl(stack, 'SharedCloudFrontOAC', {
    originAccessControlConfig: {
      name: `${stack.stackName}-SharedOAC-${Date.now()}`, // Make the name unique
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
      originAccessControlOriginType: 's3',
    }
  });

  // Flag to control if CloudFront logging is enabled
  const enableLogging = false;
  
  // Create a dedicated CloudFront logging bucket with lifecycle rules if logging is enabled
  let loggingBucket;
  if (enableLogging) {
    loggingBucket = new s3.Bucket(stack, 'CloudFrontLoggingBucket', {
      bucketName: `${props?.stackName?.toLowerCase() || 'eastmedical'}-cf-logs`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          id: 'DeleteLogsAfter90Days',
          enabled: true,
          expiration: Duration.days(90),
        },
        {
          id: 'TransitionToInfrequentAccessAfter30Days',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],
    });

    // Grant CloudFront permission to write logs to the bucket
    loggingBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [loggingBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      })
    );

    // Add ACL grant for CloudFront logs delivery
    const cfnBucket = loggingBucket.node.defaultChild;
    cfnBucket.addPropertyOverride('OwnershipControls', {
      Rules: [{ ObjectOwnership: 'ObjectWriter' }]
    });
  }

  return {
    domainName,
    baseDomain,
    hostedZone,
    loggingBucket,
    certificate: props.certificate,
    regionalCertificate,
    cloudFrontOAC,
    enableLogging,
    vpc
  };
}

module.exports = { createSharedResources }; 