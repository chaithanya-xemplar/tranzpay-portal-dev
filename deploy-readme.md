# Tranzpay Portal Deployment Guide

This guide explains how to deploy the Tranzpay Portal to AWS using ECS Fargate, Application Load Balancer, and Route 53. It also covers troubleshooting steps for common issues.

---

## 🤖 GitHub Actions Deployment (Recommended)

### 1. Setup IAM Role for GitHub Actions

Run the setup script to create a minimal IAM role:

```powershell
.\setup-github-iam.ps1
```

Or manually create the role:

```powershell
# Create OIDC provider (only once per AWS account)
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 --client-id-list sts.amazonaws.com

# Create IAM role
aws iam create-role --role-name tranzpay-portal-github-deploy-role --assume-role-policy-document file://aws-iam/github-trust-policy.json --description "Minimal role for GitHub Actions to deploy tranzpay-portal"

# Attach policy
aws iam put-role-policy --role-name tranzpay-portal-github-deploy-role --policy-name tranzpay-portal-deployment-policy --policy-document file://aws-iam/deployment-role-policy.json
```

### 2. Configure GitHub Repository

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add a new repository secret:
   - Name: `AWS_ROLE_ARN`
   - Value: `arn:aws:iam::991862549203:role/tranzpay-portal-github-deploy-role`

### 3. Deploy with GitHub Actions

- **Automatic**: Push to `main` or `OPS-127` branch
- **Manual**: Go to Actions tab → "Deploy to AWS ECS" → "Run workflow"

The workflow will:

- Build the React app
- Build and push Docker image to ECR
- Update ECS service with rolling deployment
- Wait for deployment to complete

---

## 🚀 Manual Deployment Steps

### 1. Prerequisites

- AWS CLI and Docker installed
- AWS credentials configured (`aws configure`)
- Docker Desktop running
- Access to the tranzpay.com Route 53 hosted zone

### 2. Build and Deploy

#### a. Build the React App

```
npm install
npm run build
```

#### b. Build and Push Docker Image

```
docker build -t 991862549203.dkr.ecr.us-east-1.amazonaws.com/tranzpay-portal-service-dev:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 991862549203.dkr.ecr.us-east-1.amazonaws.com
docker push 991862549203.dkr.ecr.us-east-1.amazonaws.com/tranzpay-portal-service-dev:latest
```

#### c. Register/Update ECS Task Definition

```
aws ecs register-task-definition --cli-input-json file://task-definition.json --region us-east-1
```

#### d. Update ECS Service (Rolling Update)

```
aws ecs update-service --cluster tranzpay-portal-cluster-dev --service tranzpay-portal-service-dev --force-new-deployment --region us-east-1
```

#### e. (Optional) Deploy Infrastructure with CDK

```
cd cdk
npm install
npx cdk deploy --all
```

---

## 🔒 Add SSL and Custom Domain

### 1. Request SSL Certificate

```
aws acm request-certificate --domain-name devportal.tranzpay.com --validation-method DNS --region us-east-1
```

- Add the ACM-provided CNAME to Route 53 for validation.
- Wait for the certificate to be "Issued" in ACM.

### 2. Add HTTPS Listener to ALB

```
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:991862549203:loadbalancer/app/tranzpay-portal-alb-dev/97303f38ea2c4d2a \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:991862549203:targetgroup/tranzpay-portal-tg-dev/3e30ec19dab87f54 \
  --region us-east-1
```

### 3. Create Route 53 Alias Record

```
aws route53 change-resource-record-sets --hosted-zone-id <your-hosted-zone-id> --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "devportal.tranzpay.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "tranzpay-portal-alb-dev-1343761578.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": false
      }
    }
  }]
}' --region us-east-1
```

---

## 🛠️ Troubleshooting

### GitHub Actions Deployment Issues

- **Role assumption failed**: Check that the OIDC provider exists and the role trust policy allows your repo.
- **Permission denied**: Verify the IAM role has all required permissions in the policy.
- **ECR push failed**: Ensure the ECR repository exists and the role has ECR permissions.
- **ECS update failed**: Check that the ECS cluster and service exist and are in the correct region.

### ECS Service Not Updating

- Make sure you pushed the new Docker image to ECR.
- Run the `aws ecs update-service ... --force-new-deployment` command.
- Check ECS task logs in CloudWatch for errors.

### ALB Not Serving HTTPS

- Ensure ACM certificate is "Issued" and in `us-east-1`.
- Check that the HTTPS listener is attached to the ALB.
- Security group must allow inbound 443 (HTTPS).

### DNS Not Resolving

- Confirm Route 53 alias record points to the correct ALB DNS name.
- DNS changes may take a few minutes to propagate.

### Common AWS CLI Errors

- `RepositoryNotFoundException`: Create the ECR repo or let CDK create it.
- `TargetGroupNotFound`: Double-check target group ARN.
- `InvalidSubnetID.NotFound`: Use correct subnet IDs from your VPC.

---

## 📋 Useful Commands

- List ECS services:
  ```
  aws ecs list-services --cluster tranzpay-portal-cluster-dev --region us-east-1
  ```
- View ECS service status:
  ```
  aws ecs describe-services --cluster tranzpay-portal-cluster-dev --services tranzpay-portal-service-dev --region us-east-1
  ```
- View ALB DNS name:
  ```
  aws elbv2 describe-load-balancers --names tranzpay-portal-alb-dev --region us-east-1 --query "LoadBalancers[0].DNSName"
  ```
- View CloudWatch logs:
  ```
  aws logs describe-log-streams --log-group-name /ecs/tranzpay-portal-task-dev --region us-east-1
  aws logs get-log-events --log-group-name /ecs/tranzpay-portal-task-dev --log-stream-name <log-stream-name> --region us-east-1
  ```

---

## 🧹 Cleanup

To delete all resources (be careful!):

```
cd cdk
npx cdk destroy --all
```

Or manually delete via AWS Console.

---

For help, contact the DevOps team or check the AWS Console for resource status and logs.
