# Backend Dockerfile
FROM node:20-alpine

# Install necessary packages
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]
