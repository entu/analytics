# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001

# Copy built application from builder stage
COPY --from=builder /app/.output ./.output

# Change ownership to non-root user
RUN chown -R nuxt:nodejs /app

USER nuxt

EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

# Start the application
CMD ["node", ".output/server/index.mjs"]
