from django.urls import path
from .views import (
    UserCreateView,
    EquipoListCreateView,
    EquipoDetailView,
    EstrategiaListCreateView,
    EstrategiaDetailView,
    ComentarioListCreateView,
    UnirseEquipoView, # Nueva
    GestionarJugadorEquipoView # Nueva
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', UserCreateView.as_view(), name='user_create'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('equipos/', EquipoListCreateView.as_view(), name='equipo_list_create'),
    path('equipos/<int:pk>/', EquipoDetailView.as_view(), name='equipo_detail'),
    path('equipos/unirse/', UnirseEquipoView.as_view(), name='equipo_unirse'), # Nueva
    path('equipos/<int:equipo_pk>/gestionar_jugador/<int:jugador_pk>/', GestionarJugadorEquipoView.as_view(), name='equipo_gestionar_jugador'), # Nueva (POST para remover)

    path('estrategias/', EstrategiaListCreateView.as_view(), name='estrategia_list_create'),
    path('estrategias/<int:pk>/', EstrategiaDetailView.as_view(), name='estrategia_detail'),
    path('estrategias/<int:estrategia_pk>/comentarios/', ComentarioListCreateView.as_view(), name='comentario_list_create'),
]
