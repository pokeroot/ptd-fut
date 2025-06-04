from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Usuario(AbstractUser):
    ROLES = (
        ('entrenador', 'Entrenador'),
        ('jugador', 'Jugador'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='jugador')
    # Agrega related_name para evitar conflictos con el modelo User por defecto
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="usuario_set", # Cambiado de "user_set"
        related_query_name="usuario",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="usuario_set_permissions", # Cambiado de "user_set"
        related_query_name="usuario",
    )

class Equipo(models.Model):
    nombre = models.CharField(max_length=100)
    codigo_equipo = models.CharField(max_length=10, unique=True, blank=True, null=True) # Se generará automáticamente
    entrenador_propietario = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='equipos_creados', on_delete=models.CASCADE)
    jugadores = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='equipos_jugador', blank=True)

    def __str__(self):
        return self.nombre

class Estrategia(models.Model):
    TIPO_CAMPO_CHOICES = (
        ('Futsal', 'Futsal'),
        ('Futbol_7', 'Fútbol 7'),
        ('Futbol_11', 'Fútbol 11'),
    )
    nombre = models.CharField(max_length=255)
    tipo_campo = models.CharField(max_length=20, choices=TIPO_CAMPO_CHOICES)
    datos_estrategia = models.JSONField() # Para guardar el estado del tablero Konva.js
    equipo = models.ForeignKey(Equipo, related_name='estrategias', on_delete=models.CASCADE)
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='estrategias_creadas', on_delete=models.CASCADE)
    compartida_con_equipo = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.equipo.nombre})"

class Comentario(models.Model):
    estrategia = models.ForeignKey(Estrategia, related_name='comentarios', on_delete=models.CASCADE)
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='comentarios_realizados', on_delete=models.CASCADE)
    texto = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comentario de {self.autor.username} en {self.estrategia.nombre}"
