FROM nginx:alpine

# Copy application files to nginx webroot
COPY . /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
