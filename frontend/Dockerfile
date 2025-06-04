# --- Etapa 1: Build (Construcción de la aplicación React) ---
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (o yarn.lock)
COPY package.json package-lock.json* ./
# Si usas yarn, sería:
# COPY package.json yarn.lock ./

# Instalar dependencias
RUN npm install
# Si usas yarn:
# RUN yarn install --frozen-lockfile

# Copiar el resto del código fuente de la aplicación
COPY . .

# Construir la aplicación para producción
# Puedes pasar variables de entorno de build aquí si es necesario, ej. REACT_APP_API_URL
# RUN REACT_APP_API_URL=/api npm run build
RUN npm run build
# Si usas yarn:
# RUN yarn build

# --- Etapa 2: Server (Servir la aplicación con Nginx) ---
FROM nginx:stable-alpine

# Eliminar la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar la configuración personalizada de Nginx
# (El archivo nginx.default.conf debe estar en el mismo directorio que este Dockerfile al construir,
#  o ajustar la ruta de copia si está en otro lugar)
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos construidos de la etapa 'builder'
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto 80 (HTTP)
EXPOSE 80

# Comando por defecto para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
