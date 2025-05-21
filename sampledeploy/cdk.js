const { Stack, App, CfnOutput, Fn } = require('aws-cdk-lib');
const route53 = require('aws-cdk-lib/aws-route53');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const path = require('path');
const { createWhisperProcessing } = require('./lib/whisper-processing');
const { createSharedResources } = require('./lib/components/shared-resources');
const { LandingPageStack } = require('./lib/stacks/landing-page-stack');
const { WebStack } = require('./lib/stacks/web-stack');
const { SupabaseDbStack } = require('./lib/stacks/supabase-db-stack');
const { SupabaseServicesStack } = require('./lib/stacks/supabase-services-stack');

/**
 * Stack for ACM certificate in us-east-1 (required for CloudFront)
 */
class CertificateStack extends Stack {
  constructor(scope, id, props) {
    // Extract props we don't want to pass to the parent constructor
    const { stackName, ...otherProps } = props;
    
    super(scope, id, {
      ...otherProps,
      stackName: 'WhisperProcessingCertificate',
    });

    // Domain configuration
    const baseDomain = 'eastmedical.ai';
    const domainName = baseDomain;
    
    // Use Route53 Zone directly with ID
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'CertificateHostedZone', {
      zoneName: baseDomain,
      hostedZoneId: process.env.HOSTED_ZONE_ID || 'Z055778020D8NH7RP81J5',
    });

    // Create certificate in us-east-1
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Store references that can be used by other stacks
    this.certificateArn = certificate.certificateArn;
    this.domainName = domainName;
    this.baseDomain = baseDomain;
    this.hostedZoneId = hostedZone.hostedZoneId;
    this.zoneName = hostedZone.zoneName;

    // Export values for cross-stack references
    new CfnOutput(this, 'CertificateArn', {
      value: this.certificateArn,
      description: 'The ARN of the certificate for CloudFront',
      exportName: 'WhisperProcessingCertificateArn',
    });

    new CfnOutput(this, 'DomainName', {
      value: this.domainName,
      description: 'The domain name for the application',
      exportName: 'WhisperProcessingDomainName',
    });
  }
}

/**
 * Stack for shared resources that can be used by other stacks
 */
class SharedInfrastructureStack extends Stack {
  constructor(scope, id, props) {
    // Extract props we don't want to pass to the parent constructor
    const { stackName, ...otherProps } = props;
    
    super(scope, id, {
      ...otherProps,
      stackName: 'SharedInfrastructure',
    });

    // Import the certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'ImportedCertificate',
      props.certificateArn
    );

    // Create shared resources including VPC
    const sharedResources = createSharedResources(this, {
      ...props,
      certificate,
      domainName: props.domainName,
      baseDomain: props.baseDomain,
      hostedZoneId: props.hostedZoneId,
      zoneName: props.zoneName,
    });

    // Export the VPC to be used by other stacks
    this.vpc = sharedResources.vpc;

    // Add output for VPC
    new CfnOutput(this, 'VpcId', {
      value: sharedResources.vpc.vpcId,
      description: 'The ID of the shared VPC',
      exportName: 'SharedVpcId',
    });
  }
}

/**
 * Stack that includes whisper processing infrastructure
 */
class WhisperProcessingStack extends Stack {
  constructor(scope, id, props) {
    // Extract props we don't want to pass to the parent constructor
    const { stackName, ...otherProps } = props;
    
    super(scope, id, {
      ...otherProps,
      stackName: 'WhisperProcessing',
    });

    // Create whisper processing infrastructure, directly using the shared VPC
    // Instead of creating duplicate shared resources
    const whisperResources = createWhisperProcessing(this, { ...props, vpc: props.vpc });

    // Store references that can be used by other stacks
    this.whisperResources = whisperResources;
    
    // Output the stack name and resources for reference
    new CfnOutput(this, 'WhisperStackName', {
      value: this.stackName,
      description: 'The name of the Whisper Processing stack',
      exportName: 'WhisperProcessingStackName',
    });

    // Export key whisper resources
    if (whisperResources) {
      Object.entries(whisperResources).forEach(([key, value]) => {
        if (value && value.node) {
          new CfnOutput(this, `Whisper${key}`, {
            value: value.node.addr,
            description: `The ${key} resource from Whisper Processing`,
            exportName: `WhisperProcessing${key}`,
          });
        }
      });
    }
  }
}

const app = new App();

// Create certificate stack in us-east-1
const certificateStack = new CertificateStack(app, 'CertificateStack', {
  env: {
    region: 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
});

// Create shared infrastructure stack with VPC
const sharedStack = new SharedInfrastructureStack(app, 'SharedInfrastructureStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  certificateArn: certificateStack.certificateArn,
  domainName: certificateStack.domainName,
  baseDomain: certificateStack.baseDomain,
  hostedZoneId: certificateStack.hostedZoneId,
  zoneName: certificateStack.zoneName,
  crossRegionReferences: true,
});

// Create landing page stack
const landingStack = new LandingPageStack(app, 'LandingPageStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  certificateArn: certificateStack.certificateArn,
  domainName: certificateStack.domainName,
  baseDomain: certificateStack.baseDomain,
  hostedZoneId: certificateStack.hostedZoneId,
  zoneName: certificateStack.zoneName,
  crossRegionReferences: true,
});

// Create whisper processing stack
const whisperStack = new WhisperProcessingStack(app, 'WhisperProcessingStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  vpc: sharedStack.vpc,
  stackName: 'WhisperProcessing',  // Explicitly set stack name
});

// Create Supabase DB stack
const supabaseDbStack = new SupabaseDbStack(app, 'SupabaseDbStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  vpc: sharedStack.vpc,
  crossRegionReferences: true,
});

// Create Supabase Services stack
const supabaseServicesStack = new SupabaseServicesStack(app, 'SupabaseServicesStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  vpc: sharedStack.vpc,
  hostedZoneId: certificateStack.hostedZoneId,
  zoneName: certificateStack.zoneName,
  domainName: certificateStack.domainName,
  dbStack: supabaseDbStack,
  dockerHubSecret: process.env.DOCKERHUB_SECRET_ARN,
  crossRegionReferences: true,
});

// Create web stack (UI and API)
const webStack = new WebStack(app, 'WebStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012',
  },
  certificateArn: certificateStack.certificateArn,
  domainName: certificateStack.domainName,
  baseDomain: certificateStack.baseDomain,
  hostedZoneId: certificateStack.hostedZoneId,
  zoneName: certificateStack.zoneName,
  crossRegionReferences: true,
  whisperResources: whisperStack.whisperResources,  // Pass whisper resources to web stack
  vpc: sharedStack.vpc,  // Pass the shared VPC
});

// Add explicit dependencies
whisperStack.addDependency(sharedStack);  // Whisper stack depends on shared stack for VPC
landingStack.addDependency(certificateStack);  // Landing stack depends on certificate
webStack.addDependency(certificateStack);  // Web stack depends on certificate
webStack.addDependency(whisperStack);     // Web stack depends on whisper stack for resources
webStack.addDependency(sharedStack);      // Web stack depends on shared stack for VPC
supabaseDbStack.addDependency(sharedStack); // Supabase DB stack depends on shared stack for VPC
// Note: Services stack implicitly depends on DB stack through property references
supabaseServicesStack.addDependency(certificateStack); // Supabase Services stack depends on certificate

// Make sure we're synthesizing in the correct order
app.synth();