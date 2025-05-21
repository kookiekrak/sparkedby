const { RemovalPolicy, Duration, CfnOutput } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const sqs = require('aws-cdk-lib/aws-sqs');
const iam = require('aws-cdk-lib/aws-iam');
const ecs = require('aws-cdk-lib/aws-ecs');
const ec2 = require('aws-cdk-lib/aws-ec2');
const logs = require('aws-cdk-lib/aws-logs');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const appscaling = require('aws-cdk-lib/aws-applicationautoscaling');
const efs = require('aws-cdk-lib/aws-efs');

/**
 * Creates infrastructure components for whisper processing
 * 
 * @param {import('aws-cdk-lib').Stack} stack The parent stack
 * @param {Object} props The props
 * @returns {Object} The created resources
 */
function createWhisperProcessing(stack, props = {}) {
  const stackName = props.stackName || 'WhisperProcessing';
  const bucketName = `${stackName.toLowerCase()}-files`;

  // Import existing bucket
  const audioBucket = s3.Bucket.fromBucketName(
    stack,
    'AudioBucket',
    bucketName
  );

  // Create SQS queues for Whisper processing jobs
  const prodQueueName = `${stackName.toLowerCase()}-whisper-jobs`;
  const dlqName = `${stackName.toLowerCase()}-whisper-dlq`;

  // Create DLQ first
  const deadLetterQueue = new sqs.Queue(stack, 'WhisperDLQ', {
    queueName: dlqName,
    retentionPeriod: Duration.days(14),
  });

  // Create production queue
  const whisperQueue = new sqs.Queue(stack, 'WhisperProcessingQueue', {
    queueName: prodQueueName,
    visibilityTimeout: Duration.minutes(30),
    retentionPeriod: Duration.days(14),
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: deadLetterQueue,
    },
  });

  // Create IAM user for Vercel deployment
  const userName = `${stackName.toLowerCase()}-api-user` || 'whisper-api-user';
  const apiUser = new iam.User(stack, 'ApiUser', {
    userName,
    description: 'User for the Vercel API to access AWS services',
  });

  // Create stable access key
  const accessKey = new iam.AccessKey(stack, 'ApiUserAccessKey', {
    user: apiUser,
    serial: 1  // Use a fixed serial number instead of timestamp
  });

  // Update SQS policy to include both queues
  const sqsPolicy = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'sqs:SendMessage',
      'sqs:ReceiveMessage',
      'sqs:DeleteMessage',
      'sqs:GetQueueUrl',
      'sqs:GetQueueAttributes'
    ],
    resources: [whisperQueue.queueArn]
  });

  // Create policy for S3 access - more restrictive
  const s3Policy = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      's3:PutObject',
      's3:GetObject',
      's3:HeadObject',
      's3:ListBucket',
      's3:PutObjectAcl'
    ],
    resources: [
      `${audioBucket.bucketArn}/*`,  // Allow access to all paths initially for debugging
      audioBucket.bucketArn
    ]
  });

  // Reference existing secret
  const whisperSecret = secretsmanager.Secret.fromSecretNameV2(stack, 'WhisperSecret', 
    'whisperworker'  // The existing secret name
  );

  // Add new SecretsManager policy
  const secretsPolicy = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'secretsmanager:GetSecretValue',
      'secretsmanager:DescribeSecret'  // Adding this permission as well for completeness
    ],
    resources: [
      `arn:aws:secretsmanager:${stack.region}:${stack.account}:secret:whisperworker-*`,  // Using wildcard to match any version/suffix
      whisperSecret.secretArn
    ]
  });

  // Create a combined policy for the user
  const combinedPolicy = new iam.Policy(stack, 'ApiUserPolicy', {
    statements: [sqsPolicy, s3Policy, secretsPolicy],
  });

  // Attach the policy to the user
  apiUser.attachInlinePolicy(combinedPolicy);

  // Add bucket policy to enforce encryption and secure transport
  if (audioBucket instanceof s3.Bucket) {
    audioBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ArnPrincipal(apiUser.userArn)],
      actions: ['s3:*'],
      resources: [
        audioBucket.bucketArn,
        `${audioBucket.bucketArn}/*`
      ]
    }));
  }

  // Create explicit CloudFormation outputs
  new CfnOutput(stack, 'AccessKeyId', {
    value: accessKey.accessKeyId,
    description: 'The AWS access key ID for the Vercel deployment',
  });

  new CfnOutput(stack, 'SecretAccessKey', {
    value: accessKey.secretAccessKey,
    description: 'The AWS secret access key for the Vercel deployment',
  });

  new CfnOutput(stack, 'BucketName', {
    value: audioBucket.bucketName,
    description: 'The name of the S3 bucket for audio files',
  });

  new CfnOutput(stack, 'ProdQueueUrl', {
    value: whisperQueue.queueUrl,
    description: 'The URL of the production SQS queue for Whisper jobs',
  });

  new CfnOutput(stack, 'Region', {
    value: stack.region,
    description: 'The AWS region where resources are deployed',
  });

  // Create VPC for ECS
  const vpc = props.vpc || (() => {
    // Create log group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(stack, 'WhisperVpcFlowLogsGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    
    // Create a new VPC if one wasn't passed in
    const newVpc = new ec2.Vpc(stack, 'WhisperVpc', {
      maxAzs: 2,
      natGateways: 1,
    });
    
    // Enable VPC Flow Logs to CloudWatch
    newVpc.addFlowLog('WhisperFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
      flowLogName: 'WhisperVpcTrafficMonitoring',
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE
    });
    
    return newVpc;
  })();

  // Create ECS Cluster
  const cluster = new ecs.Cluster(stack, 'WhisperCluster', {
    vpc,
    containerInsightsV2: ecs.ContainerInsights.ENABLED
  });

  // Fix the CloudFormation properties for containerInsightsV2
  const cfnCluster = cluster.node.defaultChild;
  cfnCluster.addPropertyOverride('ClusterSettings', [
    {
      Name: 'containerInsights',
      Value: 'enabled'
    }
  ]);

  // Create Log Group
  const logGroup = new logs.LogGroup(stack, 'WhisperServiceLogs', {
    retention: logs.RetentionDays.ONE_WEEK,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // Create EFS File System for model caching
  const efsSecurityGroup = new ec2.SecurityGroup(stack, 'WhisperEFSSecurityGroup', {
    vpc,
    description: 'Security group for Whisper EFS',
    allowAllOutbound: true,
  });
  
  const modelCache = new efs.FileSystem(stack, 'WhisperModelCache', {
    vpc,
    lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
    performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
    throughputMode: efs.ThroughputMode.BURSTING,
    removalPolicy: RemovalPolicy.DESTROY,
    securityGroup: efsSecurityGroup
  });

  // Create security group for ECS tasks
  const ecsSecurityGroup = new ec2.SecurityGroup(stack, 'WhisperECSSecurityGroup', {
    vpc,
    description: 'Security group for Whisper ECS tasks',
    allowAllOutbound: true,
  });

  // Allow ECS tasks to connect to EFS
  efsSecurityGroup.addIngressRule(
    ecsSecurityGroup,
    ec2.Port.tcp(2049),
    'Allow NFS traffic from ECS tasks'
  );

  // Add access point for the container
  const accessPoint = modelCache.addAccessPoint('WhisperContainerAccess', {
    path: '/whisper-models',
    createAcl: {
      ownerGid: '1000',
      ownerUid: '1000',
      permissions: '755'
    },
    posixUser: {
      gid: '1000',
      uid: '1000'
    }
  });
  
  // Get the mount targets so we can add explicit dependencies
  const mountTargets = modelCache.node.findAll().filter(child => 
    child.node && child.node.id && child.node.id.includes('EfsMountTarget')
  );

  // Create Fargate Task Definition
  const taskDefinition = new ecs.FargateTaskDefinition(stack, 'WhisperTask', {
    memoryLimitMiB: 2048,
    cpu: 1024,
    volumes: [{
      name: 'model-cache',
      efsVolumeConfiguration: {
        fileSystemId: modelCache.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED'
        },
        rootDirectory: '/' // Explicitly set the root directory
      }
    }]
  });

  // Make sure task role has EFS access
  taskDefinition.addToTaskRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:ClientWrite',
        'elasticfilesystem:ClientRootAccess',
        'elasticfilesystem:DescribeMountTargets'
      ],
      resources: [modelCache.fileSystemArn]
    })
  );

  // Add permissions to execution role as well
  taskDefinition.addToExecutionRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:ClientWrite'
      ],
      resources: [modelCache.fileSystemArn]
    })
  );

  // Add explicit policy for S3 VPC endpoint access
  taskDefinition.addToTaskRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
        's3:DeleteObject'
      ],
      resources: [
        `${audioBucket.bucketArn}/*`,
        audioBucket.bucketArn
      ]
    })
  );

  // Add explicit policy for VPC endpoint access
  taskDefinition.addToExecutionRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket'
      ],
      resources: [
        `${audioBucket.bucketArn}/*`,
        audioBucket.bucketArn
      ]
    })
  );

  // Create Fargate Task Definition with container
  const container = taskDefinition.addContainer('WhisperContainer', {
    image: ecs.ContainerImage.fromAsset('../whisper'),
    logging: ecs.LogDriver.awsLogs({
      streamPrefix: 'whisper',
      logGroup,
    }),
    environment: {
      WHISPER_QUEUE_URL: whisperQueue.queueUrl,
      S3_BUCKET_NAME: audioBucket.bucketName,
      AWS_REGION: stack.region,
      ENVIRONMENT: 'production',
      MODEL_CACHE_DIR: '/mnt/models',  // Directory for caching models
      // Add container health check environment variables
      AWS_EC2_METADATA_DISABLED: 'true',  // Disable EC2 metadata service for faster startup
      AWS_USE_FIPS_ENDPOINT: 'false',  // Disable FIPS endpoint
      AWS_STS_REGIONAL_ENDPOINTS: 'regional'  // Use regional endpoints
    },
    secrets: {
      OPENAI_API_KEY: ecs.Secret.fromSecretsManager(whisperSecret, 'OPENAI_API_KEY'),
      API_TOKEN: ecs.Secret.fromSecretsManager(whisperSecret, 'API_TOKEN')
    }
  });

  // Add mount point for the model cache
  container.addMountPoints({
    sourceVolume: 'model-cache',
    containerPath: '/mnt/models',
    readOnly: false
  });

  // Create Fargate Service
  const service = new ecs.FargateService(stack, 'WhisperService', {
    cluster,
    taskDefinition,
    desiredCount: 1,  // Start with 1 task to ensure service availability
    maxHealthyPercent: 200,
    minHealthyPercent: 0,  // Ensure we always have some capacity
    securityGroups: [ecsSecurityGroup],
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
    },
    assignPublicIp: false,
    platformVersion: ecs.FargatePlatformVersion.VERSION1_4
  });
  
  // Add explicit dependencies on the EFS mount targets
  // This ensures the mount targets are fully available before the service is created
  if (mountTargets && mountTargets.length > 0) {
    for (const mountTarget of mountTargets) {
      service.node.addDependency(mountTarget);
    }
  }

  // Grant permissions to both queues
  whisperQueue.grantConsumeMessages(taskDefinition.taskRole);
  audioBucket.grantReadWrite(taskDefinition.taskRole);
  whisperSecret.grantRead(taskDefinition.taskRole);

  // Auto-scaling configuration
  const scaling = service.autoScaleTaskCount({
    minCapacity: 1,  // Maintain at least one task for availability
    maxCapacity: 5,  // Scale up to 5 tasks based on demand
  });

  // Scale based on queue depth with more granular steps
  scaling.scaleOnMetric('QueueMessagesVisible', {
    metric: new cloudwatch.MathExpression({
      expression: 'prod',
      usingMetrics: {
        prod: whisperQueue.metricApproximateNumberOfMessagesVisible(),
      },
    }),
    scalingSteps: [
      { upper: 5, change: -1 },    // Scale down if less than 5 messages
      { lower: 10, change: +1 },   // Scale up by 1 if more than 10 messages
      { lower: 20, change: +2 },   // Scale up by 2 if more than 20 messages
      { lower: 50, change: +3 },   // Scale up by 3 if more than 50 messages
    ],
    adjustmentType: appscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    cooldown: Duration.seconds(300),  // 5 minute cooldown between scaling actions
  });

  // Add CloudWatch Dashboard
  const dashboard = new cloudwatch.Dashboard(stack, 'WhisperDashboard', {
    dashboardName: `${stackName.toLowerCase()}-metrics`,
  });

  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'SQS Queue Metrics',
      left: [
        whisperQueue.metricApproximateNumberOfMessagesVisible(),
        whisperQueue.metricApproximateNumberOfMessagesNotVisible(),
      ],
    }),
    new cloudwatch.GraphWidget({
      title: 'ECS Service Metrics',
      left: [
        service.metric('CPUUtilization'),
        service.metric('MemoryUtilization'),
      ],
    })
  );

  // Add new outputs
  new CfnOutput(stack, 'EcsClusterName', {
    value: cluster.clusterName,
    description: 'The name of the ECS cluster',
  });

  new CfnOutput(stack, 'LogGroupName', {
    value: logGroup.logGroupName,
    description: 'The name of the CloudWatch log group',
  });

  return {
    audioBucket,
    whisperQueue,
    apiUser,
    service,
    cluster,
    logGroup,
    whisperSecret,
    vpc
  };
}

module.exports = { createWhisperProcessing }; 