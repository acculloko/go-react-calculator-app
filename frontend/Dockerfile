# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with unprivileged Nginx (runs as non-root UID 101 by default)
FROM nginxinc/nginx-unprivileged:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Configure Nginx on port 8080 (unprivileged users cannot bind to ports below 1024)
RUN printf 'server {\n\
    listen 8080;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://backend:8080/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]