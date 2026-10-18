# Legal App Dockerfile  
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
COPY apps/legal-app/package*.json ./apps/legal-app/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Skip building shared UI for now (development mode)
# RUN npm run build:shared-ui

# Change to legal app directory
WORKDIR /app/apps/legal-app

# Update the dev script to use port 8006
RUN sed -i 's/-p 3006/-p 8006/g' package.json

# Expose port
EXPOSE 8006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8006 || exit 1

# Start development server
CMD ["npm", "run", "dev"]
