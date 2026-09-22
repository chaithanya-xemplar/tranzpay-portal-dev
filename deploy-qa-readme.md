# QA Environment Deployment Guide

## Overview
The QA environment deploys the Tranzpay Portal to `portal.qa.tranzpay.com` for quality assurance testing.

## Infrastructure Details

### AWS Resources
- **ECS Cluster**: `tranzpay-portal-cluster-qa`
- **ECS Service**: `tranzpay-portal-service-qa`
- **ECR Repository**: `tranzpay-portal-service-qa`
- **Task Definition**: `tranzpay-portal-task-qa`
- **Environment**: `qa`
- **Region**: `us-east-1`

### Configuration
- **CPU**: 256 (0.25 vCPU)
- **Memory**: 512 MB
- **Desired Count**: 1 task
- **Auto-scaling**: Disabled (QA environment)
- **Container Port**: 80

## Deployment Methods

### 1. Automatic Deployment (GitHub Actions)

The QA environment automatically deploys when you push to the `qa` branch:

```bash
git checkout qa
git merge dev  # or your feature branch
git push origin qa
```

The GitHub Actions workflow will:
1. Detect the `qa` branch
2. Build the React application
3. Build and push Docker image to ECR
4. Update the ECS task definition
5. Deploy to the QA cluster
6. Wait for service stability

**View deployment status**: Go to GitHub → Actions tab

### 2. Manual Deployment (PowerShell)

For local deployments from Windows:

```powershell
# Make sure you're on the qa branch
git checkout qa

# Run the deployment script
.\deploy-qa.ps1
```

This script will:
- Build the React app
- Deploy the CDK stack (if infrastructure changes)
- Build and push Docker image
- Clean up old ECR images (keeps 10 most recent)
- Output the Load Balancer URL

### 3. Manual Deployment (AWS CLI)

Force a new deployment without code changes:

```bash
aws ecs update-service \
  --cluster tranzpay-portal-cluster-qa \
  --service tranzpay-portal-service-qa \
  --force-new-deployment \
  --region us-east-1
```

## Route 53 Setup

### Initial Setup (One-time)

1. **Get the Load Balancer DNS**:
   ```powershell
   aws elbv2 describe-load-balancers --region us-east-1 | ConvertFrom-Json | Select-Object -ExpandProperty LoadBalancers | Where-Object { $_.LoadBalancerName -like "*TranzpayPortalStackQA*" }
   ```

2. **Create Route 53 Record**:
   - Go to AWS Console → Route 53
   - Select your hosted zone for `tranzpay.com`
   - Create a new **A Record**:
     - **Name**: `portal.qa`
     - **Type**: A - IPv4 address
     - **Alias**: Yes
     - **Alias Target**: Select the QA load balancer (TranzpayPortalStackQA-*)
     - **Routing Policy**: Simple
     - **Evaluate Target Health**: Yes

3. **SSL Certificate** (if using HTTPS):
   - Request a certificate in ACM for `portal.qa.tranzpay.com`
   - Update the load balancer to use HTTPS listener
   - Redirect HTTP to HTTPS

## Monitoring & Troubleshooting

### Check Service Status

```powershell
aws ecs describe-services `
  --cluster tranzpay-portal-cluster-qa `
  --services tranzpay-portal-service-qa `
  --region us-east-1
```

### View Logs

```powershell
# Get the latest log stream
aws logs describe-log-streams `
  --log-group-name /ecs/tranzpay-portal-task-qa `
  --region us-east-1 `
  --order-by LastEventTime `
  --descending `
  --max-items 1

# View logs (replace <stream-name> with actual stream name)
aws logs tail /ecs/tranzpay-portal-task-qa `
  --follow `
  --region us-east-1
```

### List Running Tasks

```powershell
aws ecs list-tasks `
  --cluster tranzpay-portal-cluster-qa `
  --service-name tranzpay-portal-service-qa `
  --region us-east-1
```

### Check Task Health

```powershell
# Get task ARN from list-tasks, then:
aws ecs describe-tasks `
  --cluster tranzpay-portal-cluster-qa `
  --tasks <task-arn> `
  --region us-east-1
```

## Environment Variables

The QA container runs with:
- `NODE_ENV=qa`

To add more environment variables, update `task-definition-qa.json`:

```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "qa"
    },
    {
      "name": "API_URL",
      "value": "https://api.qa.tranzpay.com"
    }
  ]
}
```

## Fargate Platform Version Updates

AWS will occasionally update Fargate platform versions. To manually update tasks:

```powershell
aws ecs update-service `
  --service tranzpay-portal-service-qa `
  --cluster tranzpay-portal-cluster-qa `
  --force-new-deployment `
  --region us-east-1
```

## Cost Optimization

The QA environment is configured for minimal cost:
- **1 task** (vs 2+ in production)
- **No auto-scaling** (prevents unexpected scaling)
- **Smaller resources** (256 CPU / 512 MB)
- **Image retention** (keeps only 10 most recent images)

**Estimated monthly cost**: ~$10-15 USD (Fargate + ALB + ECR storage)

## Rollback

To rollback to a previous deployment:

```powershell
# List task definitions
aws ecs list-task-definitions `
  --family-prefix tranzpay-portal-task-qa `
  --region us-east-1

# Update service to use a specific revision
aws ecs update-service `
  --cluster tranzpay-portal-cluster-qa `
  --service tranzpay-portal-service-qa `
  --task-definition tranzpay-portal-task-qa:REVISION_NUMBER `
  --region us-east-1
```

## Quick Reference

| Environment | Branch | URL | Cluster | Service |
|------------|--------|-----|---------|---------|
| QA | `qa` | https://portal.qa.tranzpay.com | tranzpay-portal-cluster-qa | tranzpay-portal-service-qa |
| Dev | `dev` | (Load Balancer DNS) | tranzpay-portal-cluster-dev | tranzpay-portal-service-dev |

## Teardown

To remove the QA environment:

```powershell
cd cdk
npx cdk destroy TranzpayPortalStackQA --region us-east-1
```

This will delete:
- ECS Cluster and Service
- Load Balancer and Target Groups
- CloudWatch Log Groups
- (ECR repository must be deleted manually if it contains images)

## Support

For issues or questions:
1. Check CloudWatch logs: `/ecs/tranzpay-portal-task-qa`
2. Review GitHub Actions workflow runs
3. Verify Route 53 DNS propagation: `nslookup portal.qa.tranzpay.com`
4. Check ECS service events in AWS Console
