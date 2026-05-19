FROM nginx:alpine

# Remover a configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar a configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os ativos estáticos para o diretório do servidor web do Nginx
COPY . /usr/share/nginx/html/

# Limpar arquivos desnecessários na imagem de produção
RUN rm -rf /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/nginx.conf \
           /usr/share/nginx/html/personas.md \
           /usr/share/nginx/html/design-system.md

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
