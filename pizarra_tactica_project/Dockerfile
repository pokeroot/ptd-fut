# Usar una imagen base oficial de Python 3.10
FROM python:3.10-slim

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

# Consideración para STATIC_ROOT y collectstatic:
# Si STATIC_ROOT está configurado en settings.py (ej. BASE_DIR / 'staticfiles'),
# puedes descomentar la siguiente línea para que los estáticos del admin se recolecten.
# RUN python manage.py collectstatic --noinput --clear

# Exponer el puerto en el que Gunicorn correrá
EXPOSE 8000

# Comando para ejecutar la aplicación con Gunicorn
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8000", "pizarra_tactica_project.wsgi:application"]
