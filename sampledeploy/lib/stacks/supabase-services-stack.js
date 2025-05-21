const { 
  Stack,
  Duration,
  aws_ec2: ec2,
  aws_ecs: ecs,
  aws_servicediscovery: servicediscovery,
  aws_elasticloadbalancingv2: elbv2,
  aws_route53: route53,
  aws_route53_targets: targets,
  aws_iam: iam,
  aws_logs: logs,
  aws_cloudwatch: cloudwatch,
  aws_certificatemanager: acm,
  aws_secretsmanager: secretsmanager,
  CfnOutput,
} = require('aws-cdk-lib');

class SupabaseServicesStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, {
      ...props,
      stackName: 'SupabaseServices',
    });

    const {
      vpc,
      hostedZoneId,
      zoneName,
      certificateArn,
      domainName,
      dbStack,
    } = props;

    // Create hosted zone reference
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'SupabaseHostedZone', {
      zoneName,
      hostedZoneId,
    });

    // Create a new certificate in us-east-2 for the ALB
    const certificate = new acm.Certificate(this, 'SupabaseCertificate', {
      domainName: `supabase.${domainName}`,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create security group for services
    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'SupabaseServiceSG', {
      vpc,
      description: 'Security group for Supabase ECS services',
      allowAllOutbound: true,
    });

    // Allow ALB to reach services
    const lbSecurityGroup = new ec2.SecurityGroup(this, 'SupabaseLbSG', {
      vpc,
      description: 'Security group for Supabase load balancer',
      allowAllOutbound: true,
    });

    // Allow service-to-service communication
    serviceSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.allTcp(),
      'Allow internal communication between Supabase services'
    );

    // Allow LB to connect to services
    serviceSecurityGroup.addIngressRule(
      lbSecurityGroup,
      ec2.Port.tcp(80),
      'Allow load balancer to connect to services'
    );

    // Allow LB to connect to Kong admin API for health checks
    serviceSecurityGroup.addIngressRule(
      lbSecurityGroup,
      ec2.Port.tcp(8001),
      'Allow load balancer to connect to Kong admin API for health checks'
    );

    // Allow explicit access to PgBouncer port
    serviceSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(6432),
      'Allow explicit access to PgBouncer'
    );

    // Allow services to connect to RDS - moved from DB stack to here
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ImportedDbSecurityGroup',
      dbStack.dbSecurityGroup.securityGroupId
    );

    dbSecurityGroup.connections.allowFrom(
      serviceSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Supabase services to connect to PostgreSQL'
    );

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'SupabaseCluster', {
      vpc,
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: 'supabase.local',
        vpc,
        description: 'Namespace for Supabase services',
      }
    });

    // Create task execution role
    const executionRole = new iam.Role(this, 'SupabaseTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ],
    });

    // Add permissions to read secrets
    dbStack.dbPasswordSecret.grantRead(executionRole);
    dbStack.jwtSecret.grantRead(executionRole);
    dbStack.annonKey.grantRead(executionRole);
    dbStack.serviceRoleKey.grantRead(executionRole);

    // Create task role
    const taskRole = new iam.Role(this, 'SupabaseTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Create ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'SupabaseALB', {
      vpc,
      internetFacing: true,
      securityGroup: lbSecurityGroup,
    });

    // Create HTTPS listener
    const httpsListener = lb.addListener('SupabaseHttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // Create HTTP listener that redirects to HTTPS
    lb.addListener('SupabaseHttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      }),
    });

    // Common environment variables
    const commonEnv = {
      POSTGRES_HOST: dbStack.dbInstance.dbInstanceEndpointAddress,
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: 'postgres',
      REGION: this.region,
      SUPABASE_URL: `https://supabase.${domainName}`,
      SITE_URL: `https://supabase.${domainName}`,
      ADDITIONAL_REDIRECT_URLS: `https://supabase.${domainName}`,
      API_EXTERNAL_URL: `https://api.${domainName}`,
    };

    // Common secrets
    const commonSecrets = {
      POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
      JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
      ANON_KEY: ecs.Secret.fromSecretsManager(dbStack.annonKey),
      SERVICE_ROLE_KEY: ecs.Secret.fromSecretsManager(dbStack.serviceRoleKey),
    };

    // Create Supavisor (Connection Pooler) service
    const poolerTaskDef = new ecs.FargateTaskDefinition(this, 'SupabasePoolerTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    // Create Linux parameters for pooler with increased file descriptors
    const poolerLinuxParams = new ecs.LinuxParameters(this, 'PoolerLinuxParams', {
      maxFileDescriptors: 1048576,
      initProcessEnabled: true, // Enable init process
    });

    poolerTaskDef.addContainer('SupabasePooler', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/supavisor:2.4.14'),
      environment: {
        ...commonEnv,
        PORT: '4000',
        POSTGRES_PORT: '5432',
        POSTGRES_DB: 'postgres',
        CLUSTER_POSTGRES: 'true',
        REGION: 'local',
        ERL_AFLAGS: '-proto_dist inet_tcp',
        POOLER_TENANT_ID: 'default',
        POOLER_DEFAULT_POOL_SIZE: '15',
        POOLER_MAX_CLIENT_CONN: '600',
        POOLER_POOL_MODE: 'transaction',
        DATABASE_URL: `ecto://supabase_admin:${dbStack.dbPasswordSecret}@${dbStack.dbInstance.dbInstanceEndpointAddress}:5432/_supabase`,
        ERL_MAX_PORTS: '1048576',
        EVENTS_QUEUE_SIZE: '100000',
        EVENTS_QUEUE_POLL_INTERVAL: '100',
        EVENTS_QUEUE_POLL_TIMEOUT: '100',
        SUBSCRIPTION_SYNC_INTERVAL: '60000',
        ENABLE_TELEMETRY: 'false',
        ENABLE_DASHBOARD: 'true',
        DASHBOARD_PORT: '4000',
        METRICS_BEARER_TOKEN: 'OVERRIDE_ME',
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
        API_JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        SECRET_KEY_BASE: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        VAULT_ENC_KEY: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        METRICS_JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
      },
      linuxParameters: poolerLinuxParams,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-pooler',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [
        { containerPort: 5432 },  // Main Postgres port
        { containerPort: 6543 },  // Transaction pooling port
        { containerPort: 4000 },  // Dashboard/metrics port
      ],
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -sSfL --head -o /dev/null http://127.0.0.1:4000/api/health || exit 1'
        ],
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        retries: 5,
        startPeriod: Duration.seconds(120),
      },
    });

    const poolerService = new ecs.FargateService(this, 'SupabasePoolerService', {
      cluster,
      taskDefinition: poolerTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'pooler',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(5),
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Allow explicit access to pooler ports
    serviceSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow access to main Postgres port'
    );

    serviceSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(6543),
      'Allow access to transaction pooling port'
    );

    // Create Kong API Gateway service
    const kongTaskDef = new ecs.FargateTaskDefinition(this, 'SupabaseKongTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    });

    kongTaskDef.addContainer('SupabaseKong', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/kong:2.8.1'),
      environment: {
        ...commonEnv,
        KONG_DATABASE: 'off',
        KONG_DNS_ORDER: 'LAST,A,CNAME',
        KONG_PLUGINS: 'request-transformer,cors,key-auth,acl,basic-auth',
        KONG_DNS_RESOLVER: '169.254.169.253',
        KONG_PROXY_LISTEN: '0.0.0.0:8000',
        KONG_ADMIN_LISTEN: '0.0.0.0:8001',
        KONG_PROXY_LISTEN_SSL: '0.0.0.0:8443',
        KONG_ADMIN_LISTEN_SSL: '0.0.0.0:8444',
        KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: '160k',
        KONG_NGINX_PROXY_PROXY_BUFFERS: '64 160k',
        SKIP_LIMITS_SCRIPT: 'true',
        KONG_DECLARATIVE_CONFIG_STRING: JSON.stringify({
          _format_version: '2.1',
          _transform: true,
          services: [
            {
              name: 'health',
              url: 'http://127.0.0.1:8001',
              routes: [
                {
                  name: 'health-route',
                  strip_path: true,
                  paths: ['/status', '/health'],
                  methods: ['GET']
                }
              ]
            },
            {
              name: 'auth-v1',
              url: 'http://auth.supabase.local:9999/verify',
              routes: [
                {
                  name: 'auth-v1-route',
                  strip_path: true,
                  paths: ['/auth/v1/verify']
                }
              ]
            },
            {
              name: 'rest-v1',
              url: 'http://rest.supabase.local:3000',
              routes: [
                {
                  name: 'rest-v1-route',
                  strip_path: true,
                  paths: ['/rest/v1']
                }
              ]
            },
            {
              name: 'realtime-v1',
              url: 'http://realtime.supabase.local:4000/socket',
              routes: [
                {
                  name: 'realtime-v1-route',
                  strip_path: true,
                  paths: ['/realtime/v1']
                }
              ]
            },
            {
              name: 'meta-v1',
              url: 'http://meta.supabase.local:8080',
              routes: [
                {
                  name: 'meta-v1-route',
                  strip_path: true,
                  paths: ['/meta/v1']
                }
              ]
            }
          ],
          plugins: [
            {
              name: 'cors',
              config: {
                origins: ['*'],
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                headers: ['Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'Authorization'],
                exposed_headers: ['Content-Length', 'Content-Range'],
                credentials: true,
                max_age: 3600
              }
            }
          ],
          routes: []
        })
      },
      secrets: {
        ...commonSecrets,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-kong',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [
        { containerPort: 8000 },  // Proxy
        { containerPort: 8443 },  // Proxy SSL
        { containerPort: 8001 },  // Admin API
        { containerPort: 8444 },  // Admin API SSL
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f -s -S http://localhost:8001/health || exit 1'],
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        retries: 5,
        startPeriod: Duration.seconds(60),
      },
    });

    const kongService = new ecs.FargateService(this, 'SupabaseKongService', {
      cluster,
      taskDefinition: kongTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'kong',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(10),
      platformVersion: ecs.FargatePlatformVersion.LATEST
    });

    // Create target group for Kong
    const kongTargetGroup = new elbv2.ApplicationTargetGroup(this, 'SupabaseKongTargetGroup', {
      vpc,
      port: 8001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        timeout: Duration.seconds(10),
        interval: Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200-299',
      },
    });

    // Attach Kong service to target group
    kongService.attachToApplicationTargetGroup(kongTargetGroup);

    // Configure routing rules
    httpsListener.addTargetGroups('SupabaseKongTarget', {
      targetGroups: [kongTargetGroup],
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([`supabase.${domainName}`]),
      ],
    });

    // Create GoTrue (Auth) service
    const gotrueTaskDef = new ecs.FargateTaskDefinition(this, 'SupabaseGotrueTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    gotrueTaskDef.addContainer('SupabaseGotrue', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/gotrue:v2.169.0'),
      environment: {
        ...commonEnv,
        GOTRUE_DB_DRIVER: 'postgres',
        GOTRUE_API_HOST: '0.0.0.0',
        GOTRUE_API_PORT: '9999',
        GOTRUE_DB_NAME: 'postgres',
        GOTRUE_DB_HOST: 'pooler.supabase.local',
        GOTRUE_DB_PORT: '5432',
        GOTRUE_DB_USER: 'postgres',
        DISABLE_SIGNUP: 'false',
        API_EXTERNAL_URL: `https://api.${domainName}/auth/v1`,
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        GOTRUE_DB_PASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
        GOTRUE_JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        ...commonSecrets,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-gotrue',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 9999 }],
      healthCheck: {
        command: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:9999/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
      },
    });

    const gotrueService = new ecs.FargateService(this, 'SupabaseGotrueService', {
      cluster,
      taskDefinition: gotrueTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'auth',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(5),
    });

    // Add gotrue service dependency on pgbouncer
    gotrueService.node.addDependency(poolerService);

    // Create PostgREST service
    const postgrestTaskDef = new ecs.FargateTaskDefinition(this, 'SupabasePostgrestTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    postgrestTaskDef.addContainer('SupabasePostgrest', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/postgrest/postgrest:v12.2.8'),
      environment: {
        ...commonEnv,
        PGRST_DB_URI: 'postgres://postgres:${PGPASSWORD}@pooler.supabase.local:5432/postgres',
        PGRST_DB_SCHEMA: 'public',
        PGRST_DB_ANON_ROLE: 'anon',
        PGRST_DB_USE_LEGACY_GUCS: 'false',
        PGRST_SERVER_PORT: '3000',
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        PGPASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
        PGRST_JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        ...commonSecrets,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-postgrest',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 3000 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
      },
    });

    const postgrestService = new ecs.FargateService(this, 'SupabasePostgrestService', {
      cluster,
      taskDefinition: postgrestTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'rest',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(5),
    });

    // Add postgrest service dependency on pgbouncer
    postgrestService.node.addDependency(poolerService);

    // Create Realtime service
    const realtimeTaskDef = new ecs.FargateTaskDefinition(this, 'SupabaseRealtimeTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    // Create Linux parameters for realtime with increased file descriptors
    const realtimeLinuxParams = new ecs.LinuxParameters(this, 'RealtimeLinuxParams', {
      maxFileDescriptors: 1048576,
      initProcessEnabled: true, // Enable init process
    });

    realtimeTaskDef.addContainer('SupabaseRealtime', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/realtime:v2.34.31'),
      environment: {
        ...commonEnv,
        PORT: '4000',
        DB_HOST: 'pooler.supabase.local',
        DB_PORT: '5432',
        DB_NAME: 'postgres',
        DB_USER: 'postgres',
        DB_SSL: 'false',
        SECURE_CHANNELS: 'false',
        REPLICATION_MODE: 'RLS',
        REPLICATION_POLL_INTERVAL: '100',
        ERL_MAX_PORTS: '1048576',
        EVENTS_QUEUE_SIZE: '100000',
        EVENTS_QUEUE_POLL_INTERVAL: '100',
        EVENTS_QUEUE_POLL_TIMEOUT: '100',
        SUBSCRIPTION_SYNC_INTERVAL: '60000',
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
        API_JWT_SECRET: ecs.Secret.fromSecretsManager(dbStack.jwtSecret),
        ...commonSecrets,
      },
      linuxParameters: realtimeLinuxParams,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-realtime',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 4000 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:4000/healthz || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
      },
    });

    const realtimeService = new ecs.FargateService(this, 'SupabaseRealtimeService', {
      cluster,
      taskDefinition: realtimeTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'realtime',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(5),
    });

    // Add realtime service dependency on pgbouncer
    realtimeService.node.addDependency(poolerService);

    // Create Meta service (Postgres Meta API)
    const metaTaskDef = new ecs.FargateTaskDefinition(this, 'SupabaseMetaTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    metaTaskDef.addContainer('SupabaseMeta', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/postgres-meta:v0.86.0'),
      environment: {
        ...commonEnv,
        PG_META_PORT: '8080',
        PG_META_DB_HOST: 'pooler.supabase.local',
        PG_META_DB_PORT: '5432',
        PG_META_DB_NAME: 'postgres',
        PG_META_DB_USER: 'postgres',
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        PG_META_DB_PASSWORD: ecs.Secret.fromSecretsManager(dbStack.dbPasswordSecret),
        ...commonSecrets,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-meta',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 8080 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
      },
    });

    const metaService = new ecs.FargateService(this, 'SupabaseMetaService', {
      cluster,
      taskDefinition: metaTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'meta',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(5),
    });

    // Add meta service dependency on pgbouncer
    metaService.node.addDependency(poolerService);

    // Create Studio service
    const studioTaskDef = new ecs.FargateTaskDefinition(this, 'SupabaseStudioTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    });

    studioTaskDef.addContainer('SupabaseStudio', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/supabase/studio:20250317-6955350'),
      environment: {
        ...commonEnv,
        STUDIO_PG_META_URL: 'http://meta.supabase.local:8080',
        SUPABASE_URL: `https://supabase.${domainName}`,
        SUPABASE_PUBLIC_URL: `https://supabase.${domainName}`,
        SUPABASE_RESTURL: 'http://rest.supabase.local:3000',
        SUPABASE_REALTIMEURL: 'http://realtime.supabase.local:4000',
        SUPABASE_AUTHURL: 'http://auth.supabase.local:9999',
        NEXT_PUBLIC_SITE_URL: `https://supabase.${domainName}`,
        DEFAULT_ORGANIZATION_NAME: 'Default Organization',
        DASHBOARD_USERNAME: 'supabase',
        DASHBOARD_PASSWORD: 'supabase_strong_password',
        STUDIO_PORT: '3000',
        NODE_OPTIONS: '--dns-result-order=ipv4first',
        DEBUG: 'true',
        SKIP_LIMITS_SCRIPT: 'true',
      },
      secrets: {
        STUDIO_ANON_KEY: ecs.Secret.fromSecretsManager(dbStack.annonKey),
        STUDIO_SERVICE_KEY: ecs.Secret.fromSecretsManager(dbStack.serviceRoleKey),
        ...commonSecrets,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'supabase-studio',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 3000 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: Duration.seconds(120),
        timeout: Duration.seconds(15),
        retries: 10,
        startPeriod: Duration.minutes(5),
      },
      essential: true,
    });

    const studioService = new ecs.FargateService(this, 'SupabaseStudioService', {
      cluster,
      taskDefinition: studioTaskDef,
      securityGroups: [serviceSecurityGroup],
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'studio',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
      healthCheckGracePeriod: Duration.minutes(10),
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Add studio service dependencies on other services
    studioService.node.addDependency(metaService);
    studioService.node.addDependency(gotrueService);
    studioService.node.addDependency(postgrestService);
    studioService.node.addDependency(realtimeService);
    studioService.node.addDependency(poolerService);

    // Create DNS record for Supabase
    new route53.ARecord(this, 'SupabaseDnsRecord', {
      zone: hostedZone,
      recordName: `supabase.${domainName}`,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb)),
      ttl: Duration.minutes(5),
    });

    // Create CloudWatch dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'SupabaseDashboard', {
      dashboardName: 'Supabase-Monitoring',
    });

    // Add CPU and memory utilization for each service
    [poolerService, kongService, gotrueService, postgrestService, realtimeService, metaService, studioService].forEach(service => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${service.node.id} CPU Utilization`,
          left: [service.metricCpuUtilization()],
        }),
        new cloudwatch.GraphWidget({
          title: `${service.node.id} Memory Utilization`,
          left: [service.metricMemoryUtilization()],
        })
      );
    });

    // Add database metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database CPU Utilization',
        left: [dbStack.dbInstance.metricCPUUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [dbStack.dbInstance.metricDatabaseConnections()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Free Storage Space',
        left: [dbStack.dbInstance.metricFreeStorageSpace()],
      })
    );

    // Store references that can be used by other stacks
    this.cluster = cluster;
    this.loadBalancer = lb;
    this.httpsListener = httpsListener;
    this.serviceSecurityGroup = serviceSecurityGroup;
    this.executionRole = executionRole;
    this.taskRole = taskRole;
    this.commonEnv = commonEnv;
    this.commonSecrets = commonSecrets;
    this.poolerService = poolerService;
    this.services = {
      pooler: poolerService,
      kong: kongService,
      auth: gotrueService,
      rest: postgrestService,
      realtime: realtimeService,
      meta: metaService,
      studio: studioService,
    };

    // Add outputs
    new CfnOutput(this, 'SupabaseURL', {
      value: `https://supabase.${domainName}`,
      description: 'Supabase instance URL',
      exportName: 'SupabaseURL',
    });

    new CfnOutput(this, 'PgBouncerEndpoint', {
      value: 'pgbouncer.supabase.local:6432',
      description: 'Connection pooler endpoint (internal)',
      exportName: 'SupabasePgBouncerEndpoint',
    });

    new CfnOutput(this, 'SupabaseNamespace', {
      value: cluster.defaultCloudMapNamespace?.namespaceName || 'CloudMap not enabled',
      description: 'Service discovery namespace',
      exportName: 'SupabaseNamespaceName',
    });
  }
}

module.exports = { SupabaseServicesStack }; 