FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY signin.html index.html share.html favicon.svg /usr/share/nginx/html/
COPY js/home.js /usr/share/nginx/html/js/home.js
COPY js/api.js /usr/share/nginx/html/js/api.js
COPY nginx.conf /etc/nginx/conf.d/default.conf
