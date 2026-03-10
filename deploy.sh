#!/bin/bash

VPS_USER="root"
VPS_HOST="31.14.99.171"
VPS_PATH="/var/www/light-of-india/admin"
SSH_OPTIONS="-o StrictHostKeyChecking=no -o BatchMode=yes"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying Admin Panel to admin.lightofindia.nl...${NC}"

# Step 1: Use production env for build
if [ -f ".env.production" ]; then
  cp .env.production .env.local
fi

# Step 2: TypeScript Check & Build
echo "📋 Checking TypeScript..."
if ! npm run build 2>&1 | tee /tmp/admin-build.log; then
  echo -e "${RED}❌ Build failed!${NC}"
  cat /tmp/admin-build.log
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Step 3: Check if dist folder exists
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build folder 'dist' not found!${NC}"
  exit 1
fi

# Step 4: Upload
echo "📤 Uploading to VPS..."
rsync -avz --progress --delete \
  -e "ssh ${SSH_OPTIONS}" \
  ./dist/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Upload failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Admin Panel deployed successfully!${NC}"
