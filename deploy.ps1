# PowerShell deployment script for Windows
# Defaults to us-east-1 region
$Region = "us-east-1"

Write-Host "Deploying Tranzpay Portal to AWS" -ForegroundColor Green

# Check if AWS CLI is configured
try {
    $null = aws sts get-caller-identity 2>$null
}
catch {
    Write-Host "AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker version 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Host "Docker Desktop is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Get AWS account ID
$AccountId = aws sts get-caller-identity --query Account --output text

Write-Host "Account ID: $AccountId" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green

# Build the React application
Write-Host "Building React application..." -ForegroundColor Green
npm run build

# Deploy CDK stack first to create infrastructure
Write-Host "Deploying CDK stack..." -ForegroundColor Green
Set-Location cdk
npm install
npm run build

Write-Host "Running CDK bootstrap..." -ForegroundColor Yellow
npx cdk bootstrap --region $Region

Write-Host "Running CDK deploy..." -ForegroundColor Yellow
npx cdk deploy --require-approval never --verbose --outputs-file ../cdk-outputs.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "CDK deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Build and push Docker image (after ECR repository is created)
Write-Host "Building and pushing Docker image..." -ForegroundColor Green

# Create ECR repository if it doesn't exist
try {
    aws ecr describe-repositories --repository-names tranzpay-portal-service-dev --region $Region 2>$null
}
catch {
    aws ecr create-repository --repository-name tranzpay-portal-service-dev --region $Region
}

# Get ECR login token
$LoginToken = aws ecr get-login-password --region $Region
$LoginToken | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

# Build and tag image
docker build -t tranzpay-portal-service-dev .
docker tag tranzpay-portal-service-dev:latest "$AccountId.dkr.ecr.$Region.amazonaws.com/tranzpay-portal-service-dev:latest"

# Push image
docker push "$AccountId.dkr.ecr.$Region.amazonaws.com/tranzpay-portal-service-dev:latest"

# Clean up old ECR images (keep only 10 most recent)
Write-Host "Cleaning up old ECR images (keeping 10 most recent)..." -ForegroundColor Green
try {
    $images = aws ecr list-images --repository-name tranzpay-portal-service-dev --region $Region --filter tagStatus=TAGGED | ConvertFrom-Json
    if ($images.imageIds.Count -gt 10) {
        $imagesToDelete = $images.imageIds | Select-Object -First ($images.imageIds.Count - 10)
        foreach ($image in $imagesToDelete) {
            $imageJson = $image | ConvertTo-Json -Compress
            aws ecr batch-delete-image --repository-name tranzpay-portal-service-dev --region $Region --image-ids $imageJson | Out-Null
        }
        Write-Host "Deleted $($imagesToDelete.Count) old images." -ForegroundColor Yellow
    }
    else {
        Write-Host "No old images to delete." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "No old images to delete." -ForegroundColor Yellow
}

# Read CDK outputs to get Load Balancer URL
Write-Host "Deployment complete!" -ForegroundColor Green
if (Test-Path "cdk-outputs.json") {
    $outputs = Get-Content "cdk-outputs.json" | ConvertFrom-Json
    $loadBalancerUrl = $outputs.TranzpayPortalStack.LoadBalancerDNS
    if ($loadBalancerUrl) {
        Write-Host "Your application is available at: http://$loadBalancerUrl" -ForegroundColor Green
    }
    else {
        Write-Host "Check the AWS Console for your Load Balancer URL in the CloudFormation outputs." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Check the AWS Console for your Load Balancer URL in the CloudFormation outputs." -ForegroundColor Yellow
}