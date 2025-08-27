# Frontend Client Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git

# Copy package files
COPY package*.json ./
COPY packages/shared/ui/package*.json ./packages/shared/ui/
COPY packages/shared/api/package*.json ./packages/shared/api/
COPY apps/client/package*.json ./apps/client/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared packages
RUN npm run build:shared-ui

# Change to client directory
WORKDIR /app/apps/client

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"]