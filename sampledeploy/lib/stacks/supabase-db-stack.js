const { 
  Stack,
  Duration,
  RemovalPolicy,
  aws_ec2: ec2,
  aws_rds: rds,
  aws_secretsmanager: secretsmanager,
  CfnOutput,
} = require('aws-cdk-lib');

class SupabaseDbStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, {
      ...props,
      stackName: 'SupabaseDb',
    });

    const { vpc } = props;

    // Create security group for database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'SupabaseDbSG', {
      vpc,
      description: 'Security group for Supabase database',
      allowAllOutbound: true,
    });

    // Allow connections from within the VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    // Note: Ingress rules are managed by the services stack to avoid circular dependencies

    // Create secrets for Supabase
    const dbPasswordSecret = new secretsmanager.Secret(this, 'SupabaseDbPassword', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 16,
      },
      description: 'Password for Supabase PostgreSQL database',
    });

    const jwtSecret = new secretsmanager.Secret(this, 'SupabaseJwtSecret', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 40,
      },
      description: 'JWT secret for Supabase auth',
    });

    const annonKey = new secretsmanager.Secret(this, 'SupabaseAnnonKey', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 40,
      },
      description: 'Anon key for Supabase',
    });

    const serviceRoleKey = new secretsmanager.Secret(this, 'SupabaseServiceRoleKey', {
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 40,
      },
      description: 'Service role key for Supabase',
    });

    // Add parameter group for RDS to allow md5 auth
    const parameterGroup = new rds.ParameterGroup(this, 'SupabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      description: 'Parameter group for Supabase RDS instance',
      parameters: {
        'rds.force_ssl': '0',
        'password_encryption': 'md5',
      },
    });

    // Create PostgreSQL database
    const dbInstance = new rds.DatabaseInstance(this, 'SupabasePostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      databaseName: 'postgres',
      credentials: rds.Credentials.fromPassword('postgres', dbPasswordSecret.secretValue),
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      multiAz: false,
      autoMinorVersionUpgrade: true,
      parameterGroup: parameterGroup,  // Use our custom parameter group
    });

    // Add outputs
    new CfnOutput(this, 'PostgresEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'PostgreSQL database endpoint',
      exportName: 'SupabasePostgresEndpoint',
    });

    new CfnOutput(this, 'SupabaseDbPasswordSecretArn', {
      value: dbPasswordSecret.secretArn,
      description: 'ARN of the secret containing the Supabase database password',
      exportName: 'SupabaseDbPasswordSecretArn',
    });

    new CfnOutput(this, 'SupabaseJwtSecretArn', {
      value: jwtSecret.secretArn,
      description: 'ARN of the secret containing the Supabase JWT secret',
      exportName: 'SupabaseJwtSecretArn',
    });

    new CfnOutput(this, 'SupabaseAnnonKeySecretArn', {
      value: annonKey.secretArn,
      description: 'ARN of the secret containing the Supabase Anon Key',
      exportName: 'SupabaseAnnonKeySecretArn',
    });

    new CfnOutput(this, 'SupabaseServiceRoleKeySecretArn', {
      value: serviceRoleKey.secretArn,
      description: 'ARN of the secret containing the Supabase Service Role Key',
      exportName: 'SupabaseServiceRoleKeySecretArn',
    });

    // Store references that can be used by other stacks
    this.dbInstance = dbInstance;
    this.dbSecurityGroup = dbSecurityGroup;
    this.dbPasswordSecret = dbPasswordSecret;
    this.jwtSecret = jwtSecret;
    this.annonKey = annonKey;
    this.serviceRoleKey = serviceRoleKey;
  }
}

module.exports = { SupabaseDbStack }; 