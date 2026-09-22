import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface TranzpayPortalStackProps extends cdk.StackProps {
  environment: 'dev' | 'qa' | 'prod';
}

export class TranzpayPortalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TranzpayPortalStackProps) {
    super(scope, id, props);

    const env = props.environment;

    // Use existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'TranzpayPortalVpc', {
      vpcId: 'vpc-672dac00',
    });

    // Import existing security group
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'TranzpayPortalSecurityGroup',
      'sg-0759b55b0464beb0a'
    );

    // Create ECR repository
    const repository = new ecr.Repository(this, 'TranzpayPortalRepo', {
      repositoryName: `tranzpay-portal-service-${env}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
        },
      ],
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'TranzpayPortalCluster', {
      vpc,
      clusterName: `tranzpay-portal-cluster-${env}`,
    });

    // Create Fargate service with ALB
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'TranzpayPortalService',
      {
        cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: env === 'prod' ? 2 : 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
          containerPort: 80,
          environment: {
            NODE_ENV: env === 'prod' ? 'production' : env,
          },
        },
        publicLoadBalancer: true,
        serviceName: `tranzpay-portal-service-${env}`,
      }
    );

    // Apply the existing security group to the service
    fargateService.service.connections.addSecurityGroup(securityGroup);

    // Configure health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/',
      healthyHttpCodes: '200-299',
    });

    // Auto-scaling configuration
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Output the load balancer URL
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Load balancer DNS name',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'RepositoryURI', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}
