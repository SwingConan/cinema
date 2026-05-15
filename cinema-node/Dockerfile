# =============================================
# Dockerfile — Backend (cinema-node)
# =============================================
FROM node:20-alpine

# Tạo thư mục app trong container
WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
# (Nếu package.json không đổi, bước npm ci sẽ được cache lại)
COPY package.json package-lock.json* ./

# Cài đặt production dependencies (sạch hơn npm install)
RUN npm ci --omit=dev

# Copy toàn bộ source code
COPY . .

# Tạo thư mục upload để tránh lỗi khi multer ghi file
RUN mkdir -p public/uploads/posters

# Expose port backend
EXPOSE 8000

# Lệnh khởi chạy (script "start" trong package.json)
CMD ["node", "src/server.js"]
