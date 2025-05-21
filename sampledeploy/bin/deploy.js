#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { SupabaseDbStack } = require('../lib/stacks/supabase-db-stack');
const { SupabaseServicesStack } = require('../lib/stacks/supabase-services-stack');
const { getConfig } = require('../lib/config');

const app = new cdk.App();
const config = getConfig();

// Create the database stack first
const dbStack = new SupabaseDbStack(app, 'SupabaseDb', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  vpc: config.vpc,
});

// Create the services stack that depends on the database
const servicesStack = new SupabaseServicesStack(app, 'SupabaseServices', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
  vpc: config.vpc,
  hostedZone: config.hostedZone,
  certificate: config.certificate,
  domainName: config.domainName,
  dbStack: dbStack,
  dockerHubSecret: config.dockerHubSecret,
});

// Add dependency to ensure database is created first
servicesStack.addDependency(dbStack);

app.synth(); 