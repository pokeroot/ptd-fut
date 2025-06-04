# Usar una imagen base oficial de Python
FROM python:3.9-slim

# Establecer variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema si fueran necesarias (ej. para psycopg2)
# RUN apt-get update && apt-get install -y libpq-dev gcc

# Copiar requirements.txt e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Gunicorn (servidor WSGI)
RUN pip install --no-cache-dir gunicorn

# Copiar el resto del código de la aplicación al directorio de trabajo
COPY . .

# Ejecutar collectstatic para reunir los archivos estáticos del admin y otras apps de Django.
# Esto asume que STATIC_ROOT está configurado en settings.py (ej. 'staticfiles' o 'static_collected')
# Si STATIC_ROOT no está configurado, esta línea podría fallar o no hacer nada útil.
# Por defecto, Django no sirve estáticos en producción con DEBUG=False, así que Nginx debería manejarlos.
# Pero collectstatic es necesario para que Nginx los encuentre.
# Asegurarse que settings.py tenga STATIC_ROOT = BASE_DIR / 'staticfiles' o similar.
# RUN python manage.py collectstatic --noinput --clear
# Comentado por ahora, ya que requiere configuración en settings.py y podría fallar si no está.
# Se puede descomentar y ajustar si se configura STATIC_ROOT.
# Una alternativa es que el docker-compose monte un volumen para estáticos que Nginx sirva.

# Exponer el puerto en el que Gunicorn correrá
EXPOSE 8000

# Comando para ejecutar la aplicación con Gunicorn
# Asegúrate que 'pizarra_tactica_project.wsgi:application' sea la ruta correcta a tu archivo wsgi.py
# El número de workers puede ajustarse según los recursos del servidor. (2 * num_cores) + 1 es una guía común.
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8000", "pizarra_tactica_project.wsgi:application"]
