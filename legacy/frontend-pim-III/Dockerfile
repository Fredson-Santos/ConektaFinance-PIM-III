# Estágio 1: Compilar os assets estáticos com Vite
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Recebe a URL da API como build arg (injetada pelo docker-compose)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Estágio 2: Servir os arquivos compilados com Nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html/
RUN chmod -R 755 /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
