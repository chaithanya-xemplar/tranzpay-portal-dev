#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Tranzpay Portal to AWS${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

echo -e "${GREEN}📋 Account ID: $ACCOUNT_ID${NC}"
echo -e "${GREEN}📍 Region: $REGION${NC}"

# Build the React application
echo -e "${GREEN}🔨 Building React application...${NC}"
npm run build

# Build and push Docker image
echo -e "${GREEN}🐳 Building and pushing Docker image...${NC}"

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names tranzpay-portal --region $REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name tranzpay-portal-service-dev --region $REGION

# Get ECR login token
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and tag image
docker build -t tranzpay-portal-service-dev .
docker tag tranzpay-portal-service-dev:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tranzpay-portal-service-dev:latest

# Push image
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tranzpay-portal:latest

# Deploy CDK stack
echo -e "${GREEN}☁️ Deploying CDK stack...${NC}"
cd cdk
npm install
npm run build
npx cdk bootstrap --region $REGION
npx cdk deploy --require-approval never

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your application will be available at the Load Balancer URL shown above.${NC}"
