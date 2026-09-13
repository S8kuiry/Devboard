FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests first
COPY package*.json ./

# Use npm ci + BuildKit cache to skip downloading packages on rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy application source files
COPY . .

# Build production assets
RUN npm run build

# Production runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]