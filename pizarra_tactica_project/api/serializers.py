from rest_framework import serializers
from .models import Usuario, Equipo, Estrategia, Comentario
from django.contrib.auth.hashers import make_password # Para hashear la contraseña

class UsuarioSerializer(serializers.ModelSerializer):
    # Asegúrate de que la contraseña se escriba pero no se lea
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'rol')
        extra_kwargs = {'email': {'required': True}}


    def create(self, validated_data):
        # Hashea la contraseña antes de guardar el usuario
        validated_data['password'] = make_password(validated_data.get('password'))
        return super(UsuarioSerializer, self).create(validated_data)

class ComentarioSerializer(serializers.ModelSerializer):
    autor_username = serializers.ReadOnlyField(source='autor.username')

    class Meta:
        model = Comentario
        fields = ('id', 'estrategia', 'autor', 'autor_username', 'texto', 'fecha_creacion')
        read_only_fields = ('autor',) # El autor se asignará automáticamente en la vista

class EstrategiaSerializer(serializers.ModelSerializer):
    creador_username = serializers.ReadOnlyField(source='creador.username')
    comentarios = ComentarioSerializer(many=True, read_only=True)

    class Meta:
        model = Estrategia
        fields = ('id', 'nombre', 'tipo_campo', 'datos_estrategia', 'equipo', 'creador', 'creador_username', 'compartida_con_equipo', 'fecha_creacion', 'fecha_modificacion', 'comentarios')
        read_only_fields = ('creador',) # El creador se asignará automáticamente

class EquipoSerializer(serializers.ModelSerializer):
    entrenador_propietario_username = serializers.ReadOnlyField(source='entrenador_propietario.username')
    # Muestra los nombres de usuario de los jugadores en lugar de solo sus IDs
    jugadores_username = serializers.SerializerMethodField()
    # Permite actualizar jugadores por su ID de usuario
    jugadores = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), many=True, required=False)


    class Meta:
        model = Equipo
        fields = ('id', 'nombre', 'codigo_equipo', 'entrenador_propietario', 'entrenador_propietario_username', 'jugadores', 'jugadores_username')
        read_only_fields = ('entrenador_propietario', 'codigo_equipo') # Se asignan en la vista

    def get_jugadores_username(self, obj):
        return [jugador.username for jugador in obj.jugadores.all()]
