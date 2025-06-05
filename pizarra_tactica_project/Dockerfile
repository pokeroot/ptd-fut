# Usar una imagen base oficial de Python 3.10
FROM python:3.10-slim

# Establecer variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Crear directorio de trabajo
WORKDIR /app

# Opcional: Instalar dependencias del sistema si fueran necesarias más adelante (ej. para geoDjango o Pillow con soporte JPEG/PNG avanzado)
# Modificado para incluir gcc, build-essential, pkg-config, y libcairo2-dev
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc build-essential pkg-config libcairo2-dev && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación al directorio de trabajo
COPY . .

# Ejecutar collectstatic para reunir los archivos estáticos del admin y otras apps de Django.
# Esto requiere que STATIC_ROOT esté configurado en settings.py (ej. BASE_DIR / 'staticfiles')
# Asegúrate de crear el directorio 'staticfiles' o el que definas en STATIC_ROOT si es necesario.
# RUN python manage.py collectstatic --noinput --clear
# (Descomenta si tienes STATIC_ROOT configurado y quieres que Nginx sirva estos estáticos)

# Exponer el puerto en el que Gunicorn correrá
EXPOSE 8000

# Comando para ejecutar la aplicación con Gunicorn
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8000", "pizarra_tactica_project.wsgi:application"]
