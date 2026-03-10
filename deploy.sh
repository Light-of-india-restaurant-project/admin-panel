#!/bin/bash

# Configuration
VPS_USER="root"
VPS_HOST="31.14.99.171"
IMAGE_NAME="ghcr.io/light-of-india-restaurant-project/admin:latest"
CONTAINER_NAME="light-of-india-admin"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying Admin Panel to admin.lightofindia.nl...${NC}"

# Step 1: Build Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build --build-arg VITE_API_BASE_URL=https://api.lightofindia.nl/api/v1 -t $IMAGE_NAME . || { echo -e "${RED}❌ Docker build failed!${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker build complete${NC}"

# Step 2: Push to GitHub Container Registry
echo -e "${YELLOW}📤 Pushing to GHCR...${NC}"
docker push $IMAGE_NAME || { echo -e "${RED}❌ Docker push failed! Run: docker login ghcr.io${NC}"; exit 1; }
echo -e "${GREEN}✓ Image pushed to GHCR${NC}"

# Step 3: Deploy to VPS
echo -e "${YELLOW}🔄 Deploying to VPS...${NC}"
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
  docker pull $IMAGE_NAME
  docker stop $CONTAINER_NAME 2>/dev/null
  docker rm $CONTAINER_NAME 2>/dev/null
  cd /var/www/light-of-india && docker-compose up -d admin
  docker image prune -f
" || { echo -e "${RED}❌ VPS deployment failed!${NC}"; exit 1; }

echo -e "${GREEN}✅ Admin Panel deployed successfully!${NC}"
echo -e "${GREEN}🌐 Website: https://admin.lightofindia.nl${NC}"
