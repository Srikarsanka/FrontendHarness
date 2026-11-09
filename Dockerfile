# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi

# Copy source code and build
COPY . .
RUN npm run build:prod

# ==============================================================================
# Build Verification: Assert critical distribution assets exist
# ==============================================================================
RUN test -f dist/dnb-task-manager/browser/index.html && \
    test -f dist/dnb-task-manager/browser/assets/health.json && \
    test -d dist/dnb-task-manager/browser

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy built Angular app
COPY --from=builder /app/dist/dnb-task-manager/browser /usr/share/nginx/html

# Copy nginx config as a template (envsubst-ready)
COPY nginx/nginx.conf /etc/nginx/templates/default.conf.template

# Copy runtime environment injection files
COPY src/assets/env.template.js /usr/share/nginx/html/assets/env.template.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    test -x /docker-entrypoint.sh && \
    test -f /usr/share/nginx/html/index.html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/healthz || exit 1

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
