# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Копируем только package файлы
COPY package.json package-lock.json ./

# Устанавливаем все зависимости
RUN npm ci

# Копируем весь код и собираем
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Установка curl для healthcheck (опционально)
RUN apk add --no-cache curl

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Конфигурация nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]