const { Stack, CfnOutput } = require('aws-cdk-lib');
const { createLandingPage } = require('../components/landing-page');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const route53 = require('aws-cdk-lib/aws-route53');

class LandingPageStack extends Stack {
  constructor(scope, id, props) {
    // Extract props we don't want to pass to the parent constructor
    const { stackName, ...otherProps } = props;
    
    super(scope, id, {
      ...otherProps,
      stackName: 'LandingPage',
    });

    // Import the certificate from us-east-1 using the full ARN
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'ImportedCertificate',
      props.certificateArn
    );

    // Use Route53 Zone directly with ID
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'LandingHostedZone', {
      zoneName: props.zoneName,
      hostedZoneId: props.hostedZoneId,
    });

    // Create landing page infrastructure
    const landingResources = createLandingPage(this, props, {
      certificate,
      domainName: props.domainName,
      baseDomain: props.baseDomain,
      hostedZone,
      enableLogging: false,
    });

    // Store references that can be used by other stacks
    this.landingBucket = landingResources.landingBucket;
    this.landingDistribution = landingResources.landingDistribution;

    // Add outputs
    new CfnOutput(this, 'LandingPageURL', {
      value: `https://${props.domainName}`,
      description: 'The URL of the landing page',
      exportName: 'LandingPageURL',
    });
  }
}

module.exports = { LandingPageStack }; 