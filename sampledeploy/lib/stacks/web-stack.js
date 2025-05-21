const { Stack, CfnOutput } = require('aws-cdk-lib');
const { createUIApp } = require('../components/ui-app');
const { createAPI } = require('../components/api');
const { createSharedResources } = require('../components/shared-resources');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const route53 = require('aws-cdk-lib/aws-route53');

class WebStack extends Stack {
  constructor(scope, id, props) {
    // Extract props we don't want to pass to the parent constructor
    const { stackName, ...otherProps } = props;
    
    super(scope, id, {
      ...otherProps,
      stackName: 'Web',
    });

    // Import the certificate from us-east-1 using the full ARN
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'ImportedCertificate',
      props.certificateArn
    );

    // Use Route53 Zone directly with ID
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'WebHostedZone', {
      zoneName: props.zoneName,
      hostedZoneId: props.hostedZoneId,
    });
    
    // Create a regional certificate in the current region (us-east-2) for API Gateway
    const regionalCertificate = new acm.Certificate(this, 'RegionalCertificate', {
      domainName: `api.${props.domainName}`,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create shared resources for web components, but use the VPC from SharedInfrastructureStack
    // Instead of recreating all shared resources, just extract what we need
    // const sharedResources = createSharedResources(this, {
    //   ...props,
    //   certificate,
    //   vpc: props.vpc, // Use the VPC passed from SharedInfrastructureStack
    // });

    // Define needed resources directly
    const sharedResources = {
      certificate,
      regionalCertificate, // Pass the regional certificate to be used by API Gateway
      domainName: props.domainName,
      baseDomain: props.baseDomain,
      hostedZone,
      enableLogging: false,
      vpc: props.vpc, // Use the VPC passed from SharedInfrastructureStack
    };

    // Create UI application
    const uiResources = createUIApp(this, props, {
      ...sharedResources,
    });

    // Create API
    const apiResources = createAPI(this, props, {
      ...sharedResources,
      ...props.whisperResources || {},  // Pass whisper resources if available
    });

    // Store references that can be used by other stacks
    this.uiBucket = uiResources.uiBucket;
    this.uiDistribution = uiResources.uiDistribution;
    this.apiFunction = apiResources.apiFunction;

    // Add outputs
    new CfnOutput(this, 'UIURL', {
      value: `https://app.${props.domainName}`,
      description: 'UI application URL',
      exportName: 'WebUIURL',
    });

    new CfnOutput(this, 'APIURL', {
      value: `https://api.${props.domainName}`,
      description: 'API endpoint URL',
      exportName: 'WebAPIURL',
    });
  }
}

module.exports = { WebStack }; 