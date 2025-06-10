from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from django.db.models import Q # Import Q
from .models import Usuario, Equipo, Estrategia, Comentario
from .serializers import UsuarioSerializer, EquipoSerializer, EstrategiaSerializer, ComentarioSerializer
import random
import string

class UserCreateView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.AllowAny]

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class EquipoListCreateView(generics.ListCreateAPIView):
    serializer_class = EquipoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'entrenador':
            return Equipo.objects.filter(entrenador_propietario=user)
        elif user.rol == 'jugador':
            return user.equipos_jugador.all()
        return Equipo.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol != 'entrenador':
            raise PermissionDenied("Solo los entrenadores pueden crear equipos.")
        if Equipo.objects.filter(entrenador_propietario=user).count() >= 1:
            raise ValidationError("Los entrenadores solo pueden crear 1 equipo en la versión gratuita.")

        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while Equipo.objects.filter(codigo_equipo=codigo).exists():
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        serializer.save(entrenador_propietario=user, codigo_equipo=codigo)

class EquipoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EquipoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # Entrenador ve su equipo. Jugador ve equipos a los que pertenece.
            return Equipo.objects.filter(Q(entrenador_propietario=user) | Q(jugadores=user)).distinct()
        return Equipo.objects.none()

    def perform_update(self, serializer):
        equipo = self.get_object()
        if self.request.user != equipo.entrenador_propietario:
            raise PermissionDenied("No tienes permiso para editar este equipo.")
        # El nombre es lo único editable directamente por el entrenador aquí
        serializer.save(partial=True)


    def perform_destroy(self, instance):
        if self.request.user != instance.entrenador_propietario:
            raise PermissionDenied("No tienes permiso para eliminar este equipo.")
        instance.delete()

class UnirseEquipoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.rol != 'jugador':
            return Response({"error": "Solo los jugadores pueden unirse a equipos."}, status=status.HTTP_403_FORBIDDEN)

        codigo_equipo = request.data.get('codigo_equipo')
        if not codigo_equipo:
            return Response({"error": "El código del equipo es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            equipo = Equipo.objects.get(codigo_equipo=codigo_equipo)
        except Equipo.DoesNotExist:
            return Response({"error": "Equipo no encontrado con ese código."}, status=status.HTTP_404_NOT_FOUND)

        if user in equipo.jugadores.all():
            return Response({"mensaje": "Ya eres miembro de este equipo."}, status=status.HTTP_200_OK)

        # Aquí podrías añadir una limitación de N jugadores por equipo si es necesario para la versión gratuita
        # MAX_JUGADORES_GRATIS = 15
        # if equipo.jugadores.count() >= MAX_JUGADORES_GRATIS:
        #     return Response({"error": f"El equipo ha alcanzado el límite de {MAX_JUGADORES_GRATIS} jugadores."}, status=status.HTTP_400_BAD_REQUEST)

        equipo.jugadores.add(user)
        serializer = EquipoSerializer(equipo) # Devolver el estado actualizado del equipo
        return Response({"mensaje": f"Te has unido al equipo '{equipo.nombre}' exitosamente.", "equipo": serializer.data}, status=status.HTTP_200_OK)

class GestionarJugadorEquipoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, equipo_pk, jugador_pk, *args, **kwargs): # POST para remover
        entrenador = request.user
        if entrenador.rol != 'entrenador':
            return Response({"error": "Solo los entrenadores pueden gestionar jugadores."}, status=status.HTTP_403_FORBIDDEN)

        try:
            equipo = Equipo.objects.get(pk=equipo_pk, entrenador_propietario=entrenador)
        except Equipo.DoesNotExist:
            return Response({"error": "Equipo no encontrado o no eres el propietario."}, status=status.HTTP_404_NOT_FOUND)

        try:
            jugador = Usuario.objects.get(pk=jugador_pk, rol='jugador')
        except Usuario.DoesNotExist:
            return Response({"error": "Jugador no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if jugador not in equipo.jugadores.all():
            return Response({"error": "Este jugador no es miembro del equipo."}, status=status.HTTP_400_BAD_REQUEST)

        equipo.jugadores.remove(jugador)
        return Response({"mensaje": f"Jugador '{jugador.username}' eliminado del equipo '{equipo.nombre}'."}, status=status.HTTP_200_OK)


# Vistas para Estrategias
class EstrategiaListCreateView(generics.ListCreateAPIView):
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'entrenador':
            equipos_entrenador = Equipo.objects.filter(entrenador_propietario=user)
            return Estrategia.objects.filter(equipo__in=equipos_entrenador)
        elif user.rol == 'jugador':
            equipos_jugador = user.equipos_jugador.all()
            return Estrategia.objects.filter(equipo__in=equipos_jugador, compartida_con_equipo=True)
        return Estrategia.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol != 'entrenador':
            raise PermissionDenied("Solo los entrenadores pueden crear estrategias.")

        equipo_id = self.request.data.get('equipo')
        try:
            # El entrenador solo puede crear estrategias para SU equipo.
            equipo = Equipo.objects.get(id=equipo_id, entrenador_propietario=user)
        except Equipo.DoesNotExist:
            raise ValidationError("Debes seleccionar un equipo válido del cual eres entrenador.")

        MAX_ESTRATEGIAS_GRATIS = 5
        if Estrategia.objects.filter(equipo=equipo).count() >= MAX_ESTRATEGIAS_GRATIS:
            raise ValidationError(f"Solo puedes guardar hasta {MAX_ESTRATEGIAS_GRATIS} estrategias por equipo en la versión gratuita.")
        serializer.save(creador=user, equipo=equipo)

class EstrategiaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EstrategiaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'entrenador':
            # Entrenador puede acceder a cualquier estrategia de los equipos que posee
            equipos_entrenador = Equipo.objects.filter(entrenador_propietario=user)
            return Estrategia.objects.filter(equipo__in=equipos_entrenador)
        elif user.rol == 'jugador':
            # Jugador solo puede acceder a estrategias compartidas de los equipos a los que pertenece
            equipos_jugador = user.equipos_jugador.all()
            return Estrategia.objects.filter(equipo__in=equipos_jugador, compartida_con_equipo=True)
        return Estrategia.objects.none()

    def perform_update(self, serializer):
        estrategia = self.get_object()
        if self.request.user != estrategia.creador:
            raise PermissionDenied("No tienes permiso para editar esta estrategia.")

        # Si solo se está cambiando 'compartida_con_equipo'
        if 'compartida_con_equipo' in serializer.validated_data and len(serializer.validated_data) == 1:
            # El creador (entrenador) puede cambiar el estado de compartir
            serializer.save()
            return

        # Para otras actualizaciones, validar que el equipo (si cambia) le pertenezca
        equipo_id_data = serializer.validated_data.get('equipo') # serializer.validated_data.get('equipo') puede ser un objeto Equipo o un ID

        equipo_id = None
        if isinstance(equipo_id_data, Equipo):
            equipo_id = equipo_id_data.id
        elif isinstance(equipo_id_data, int): # assuming team is passed as ID for update
            equipo_id = equipo_id_data
        elif equipo_id_data is None and 'equipo' in serializer.validated_data: # If 'equipo' is explicitly set to null
             raise ValidationError("No se puede desasociar una estrategia de un equipo de esta manera.")


        if equipo_id and estrategia.equipo_id != equipo_id:
            try:
                nuevo_equipo = Equipo.objects.get(id=equipo_id, entrenador_propietario=self.request.user)
                serializer.save(equipo=nuevo_equipo)
            except Equipo.DoesNotExist:
                raise ValidationError("No puedes asignar esta estrategia a un equipo del cual no eres entrenador.")
        else:
            # Esto cubre el caso donde 'equipo' no está en validated_data (no se intenta cambiar)
            # o donde equipo_id es el mismo que el actual.
            serializer.save()


    def perform_destroy(self, instance):
        if self.request.user != instance.creador:
            raise PermissionDenied("No tienes permiso para eliminar esta estrategia.")
        instance.delete()

# Vistas para Comentarios
class ComentarioListCreateView(generics.ListCreateAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estrategia_pk = self.kwargs['estrategia_pk']
        user = self.request.user
        try:
            estrategia = Estrategia.objects.get(pk=estrategia_pk)
            if estrategia.equipo.entrenador_propietario == user or \
               (user in estrategia.equipo.jugadores.all() and estrategia.compartida_con_equipo):
                return Comentario.objects.filter(estrategia_id=estrategia_pk).order_by('-fecha_creacion')
            else:
                return Comentario.objects.none()
        except Estrategia.DoesNotExist:
            return Comentario.objects.none()

    def perform_create(self, serializer):
        print(f"[ComentarioListCreateView] request.data para nuevo comentario: {self.request.data}") # Log añadido
        estrategia_pk = self.kwargs['estrategia_pk']
        user = self.request.user
        try:
            estrategia = Estrategia.objects.get(pk=estrategia_pk)
            if not (estrategia.equipo.entrenador_propietario == user or \
                    (user in estrategia.equipo.jugadores.all() and estrategia.compartida_con_equipo)):
                raise PermissionDenied("No tienes permiso para comentar en esta estrategia.")
            serializer.save(autor=user, estrategia_id=estrategia_pk)
        except Estrategia.DoesNotExist:
            raise ValidationError("La estrategia especificada no existe.")
