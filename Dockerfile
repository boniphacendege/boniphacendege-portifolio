# ==============================================================================
# Multi-Stage Dockerfile for Boniphace Ndege Portfolio
# Production deployment on Google Cloud Run or any container platform
# ==============================================================================

# STAGE 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm install

# Copy application source files
COPY . .

# Build production client bundle
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Copy package manifests and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev --no-audit

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy production Express server
COPY server ./server

# Ensure non-root node user owns application files
RUN chown -R node:node /app

# Switch to unprivileged node user
USER node

# Expose default Cloud Run container port
EXPOSE 8080

# Container Healthcheck (matches server/index.js /healthz endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-8080}/healthz || exit 1

# Start production server
CMD ["node", "server/index.js"]
