# AWS CDK Deployment for Tranzpay Portal

This directory contains the AWS CDK infrastructure code to deploy the Tranzpay Portal React application to AWS using an Application Load Balancer (ALB) and ECS Fargate.

## Architecture

The deployment creates:

- **Existing VPC**: Uses our existing VPC (vpc-672dac00)
- **Existing Security Group**: Uses our existing security group (sg-0759b55b0464beb0a)
- **ECR Repository**: To store Docker images
- **ECS Cluster**: Fargate cluster to run containers
- **Application Load Balancer**: Public-facing ALB to distribute traffic
- **Auto Scaling**: Automatic scaling based on CPU and memory utilization
- **Health Checks**: Application health monitoring

## Prerequisites

1. **AWS CLI**: Install and configure with your credentials

   ```bash
   aws configure
   ```

2. **Docker**: Install Docker for building container images

3. **Node.js**: Required for CDK and the React application

4. **AWS CDK**: Install globally
   ```bash
   npm install -g aws-cdk
   ```

## Quick Deployment

### Option 1: Using PowerShell (Windows)

```powershell
.\deploy.ps1
```

### Option 2: Using Bash (Linux/Mac/WSL)

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Manual Steps

1. **Build the React application**:

   ```bash
   npm run build
   ```

2. **Build and push Docker image**:

   ```bash
   # Get your AWS account ID
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   REGION=us-east-1

   # Create ECR repository
   aws ecr create-repository --repository-name tranzpay-portal --region $REGION

   # Login to ECR
   aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

   # Build and push
   docker build -t tranzpay-portal .
   docker tag tranzpay-portal:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tranzpay-portal:latest
   docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tranzpay-portal:latest
   ```

3. **Deploy CDK stack**:
   ```bash
   cd cdk
   npm install
   npm run build
   npx cdk bootstrap
   npx cdk deploy
   ```

## Configuration

### Environment Variables

You can modify the environment variables in `lib/tranzpay-portal-stack.ts`:

```typescript
environment: {
  NODE_ENV: 'production',
  REACT_APP_API_URL: 'https://your-api-url.com',
  // Add other environment variables as needed
},
```

### Scaling Configuration

The service is configured to auto-scale between 1-10 instances based on:

- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

### Resource Allocation

- **CPU**: 256 CPU units (0.25 vCPU)
- **Memory**: 512 MiB
- **Desired Count**: 2 instances

## Monitoring and Logs

- **CloudWatch Logs**: Application logs are automatically sent to CloudWatch
- **Load Balancer Health Checks**: Configured to check the `/` endpoint
- **Auto Scaling Metrics**: CPU and memory utilization monitoring

## Cleanup

To destroy the infrastructure:

```bash
cd cdk
npx cdk destroy
```

## Cost Optimization

The current configuration is optimized for cost with:

- Single NAT Gateway
- Minimal Fargate resources
- Auto-scaling to reduce costs during low traffic

## Security

- Application runs in private subnets
- Load balancer in public subnets
- Security groups restrict access appropriately
- ECR repository includes image scanning

## Customization

### Adding Custom Domain

To add a custom domain, modify the stack to include:

- Route 53 hosted zone
- ACM certificate
- Custom domain configuration on the ALB

### Adding HTTPS

The stack can be extended to include SSL/TLS certificates using AWS Certificate Manager.

### Database Integration

For database connectivity, add RDS instances and configure security groups accordingly.

## Troubleshooting

1. **Build Issues**: Ensure all dependencies are installed with `npm install`
2. **Docker Issues**: Verify Docker is running and you have sufficient permissions
3. **AWS Permissions**: Ensure your AWS user has sufficient permissions for ECR, ECS, EC2, and CloudFormation
4. **Region Issues**: Make sure you're deploying to a region where ECS Fargate is available

## Support

For issues with the deployment, check:

- AWS CloudFormation console for stack events
- ECS console for service status
- CloudWatch logs for application errors
