FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Expose no ports (worker doesn't serve HTTP)

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ingest -u 1001

USER ingest

# Start the application
CMD ["npm", "start"] 