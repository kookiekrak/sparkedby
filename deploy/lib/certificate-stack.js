const cdk = require('aws-cdk-lib');
const route53 = require('aws-cdk-lib/aws-route53');
const acm = require('aws-cdk-lib/aws-certificatemanager');

/**
 * Stack for creating the ACM certificate in us-east-1 (required for CloudFront)
 */
class CertificateStack extends cdk.Stack {
  constructor(scope, id, props) {
    // Force us-east-1 region for the certificate (required for CloudFront)
    super(scope, id, {
      ...props,
      env: {
        account: props.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1' // CloudFront requires certificates in us-east-1
      }
    });

    const domainName = props.domainName;
    const wwwDomainName = `www.${domainName}`;

    // Look up the hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName
    });

    // Create a new wildcard ACM certificate for the domain (with a different resource ID to avoid conflicts)
    const wildcardCertificate = new acm.DnsValidatedCertificate(this, 'WildcardCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [
        wwwDomainName,
        `*.${domainName}` // Wildcard certificate for all subdomains
      ],
      hostedZone: hostedZone,
      region: 'us-east-1', // CloudFront requires certificates in us-east-1
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Store the certificate ARN and hosted zone ID so other stacks can reference them
    this.wildcardCertificateArn = wildcardCertificate.certificateArn;
    this.certificateArn = wildcardCertificate.certificateArn; // For backward compatibility
    this.hostedZoneId = hostedZone.hostedZoneId;
    
    // Output the wildcard certificate ARN
    new cdk.CfnOutput(this, 'WildcardCertificateArn', {
      value: wildcardCertificate.certificateArn,
      description: 'Wildcard Certificate ARN',
      exportName: 'SparkedByWildcardCertificateArn',
    });
    
    // Output the hosted zone ID with a unique name to avoid conflicts
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Hosted Zone ID',
      exportName: this.stackName.includes('Wildcard') ? 'SparkedByWildcardHostedZoneId' : 'SparkedBySiteHostedZoneId',
    });
  }
}

module.exports = { CertificateStack };
