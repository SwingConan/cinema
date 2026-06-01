# =============================================
# Dockerfile — Frontend (cinema-frontend)
# Multi-stage build: Builder + Nginx Production
# =============================================

# ── Stage 1: BUILD ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Truyền VITE_API_URL từ docker-compose vào lúc build
# (Vite nhúng biến này vào bundle JS, không thể đổi sau khi build)
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: PRODUCTION ─────────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Xóa cấu hình mặc định của nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy file cấu hình nginx tùy chỉnh (hỗ trợ React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file static đã build từ Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
