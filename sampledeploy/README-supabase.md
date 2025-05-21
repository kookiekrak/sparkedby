# Supabase on AWS Deployment Guide

This guide explains how to deploy an instance of Supabase to AWS using the included CDK infrastructure code.

## Overview

This deployment creates:

1. A PostgreSQL RDS instance to serve as the database
2. An ECS Fargate cluster running the Supabase Studio (web interface)
3. A load balancer to expose the web interface
4. DNS entries (if domain information is provided)
5. All necessary security groups and IAM permissions

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 14.x or later
- Yarn package manager
- AWS CDK CLI installed (`yarn global add aws-cdk`)

## Configuration with config.toml

This deployment supports using your Supabase `config.toml` file to configure the deployed instance. The deployment will automatically look for a config file at `../api/supabase/config.toml` relative to the deploy directory.

You can specify a different config file path by setting the `SUPABASE_CONFIG_PATH` environment variable:

```bash
SUPABASE_CONFIG_PATH=/path/to/your/config.toml yarn deploy:supabase
```

The following settings from config.toml are applied to the deployed instance:

- Project ID
- API configuration (port, schemas, search paths, etc.)
- Database configuration (port)
- Auth settings
- Storage configuration
- Studio settings
- And more...

## Deployment Instructions

### Step 1: Bootstrap CDK (if not already done)

CDK bootstrapping is required for deploying CloudFormation stacks. If you haven't already bootstrapped CDK in your account and region, run:

```bash
# Bootstrap in us-east-1 (required for certificates)
yarn bootstrap:us-east-1

# Bootstrap in your target region (e.g., us-east-2)
yarn bootstrap:us-east-2
```

### Step 2: Deploy the Certificate Stack

The certificate stack must be deployed to us-east-1 regardless of where you deploy the main stack, as CloudFront requires certificates in that region:

```bash
AWS_REGION=us-east-1 yarn cdk deploy CertificateStack
```

### Step 3: Deploy the Supabase Stack

Now deploy the Supabase stack to your target region, optionally specifying your config.toml path:

```bash
# Deploy to the default region using default config.toml
yarn deploy:supabase

# Deploy with a specific config.toml
SUPABASE_CONFIG_PATH=/path/to/your/config.toml yarn deploy:supabase

# Or to specifically deploy to us-east-2
SUPABASE_CONFIG_PATH=/path/to/your/config.toml yarn deploy:supabase:us-east-2
```

### Step 4: Access Supabase

Once deployment is complete, you can access the Supabase web interface using either:

1. The load balancer URL (provided in the stack outputs)
2. The domain name `supabase.yourdomain.com` (if you provided domain information)

## Configuration Options

You can modify the deployment by editing the following files:

- `deploy/lib/components/supabase.js`: Contains the main Supabase deployment logic
- `deploy/cdk.js`: Contains the stack definition and environment configuration
- Your `config.toml` file: Contains Supabase-specific configuration

Key configuration options include:

- Database instance type (default: t3.small)
- Fargate task resources (default: 1 vCPU, 2GB memory)
- Production mode settings (high availability, deletion protection, etc.)
- All Supabase configuration settings from config.toml

## Production Considerations

For production deployments, consider:

1. Setting `isProduction: true` in the SupabaseStack constructor to enable:
   - Multi-AZ database deployment
   - Deletion protection
   - Longer health check intervals

2. Using a larger instance type for the database

3. Setting up backup policies for the RDS instance

4. Adding HTTPS support with proper certificates

5. Securing your Supabase auth settings in the config.toml

## Troubleshooting

### Common Issues

1. **Connection Issues**: Ensure security groups allow traffic on the required ports (specified in your config.toml)

2. **Deployment Failures**: Check CloudFormation events in the AWS Console for detailed error messages

3. **Database Connection Issues**: Verify the database credentials are correctly passed to the Supabase container

4. **Config Issues**: Make sure your config.toml is valid and the path is correctly specified

### Logs

- ECS Container Logs: Check CloudWatch Logs under the `/aws/ecs/supabase` log group
- RDS Logs: Check RDS console for database logs

## Cleanup

To remove the deployed resources:

```bash
# Remove the Supabase stack
yarn cdk destroy SupabaseStack

# Remove the certificate stack (only if no other stacks are using it)
AWS_REGION=us-east-1 yarn cdk destroy CertificateStack
```

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase Config Documentation](https://supabase.com/docs/guides/local-development/cli/config)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS ECS Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [AWS RDS Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html) 