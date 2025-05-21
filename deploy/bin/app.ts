#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SparkedByLandingStack } from '../lib/landing-stack';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../api/.env' });

const app = new cdk.App();

new SparkedByLandingStack(app, 'SparkedByLandingStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  tags: {
    Project: 'SparkedBy',
    Environment: 'Production',
  }
});
