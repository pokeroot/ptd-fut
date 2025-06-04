# Pizarra Táctica Digital

Esta aplicación web es una Pizarra Táctica Digital diseñada para entrenadores de Futsal, Fútbol 7 y Fútbol 11. Permite a los entrenadores crear, guardar, visualizar, y compartir jugadas y estrategias de forma digital con sus jugadores.

## Roles de Usuario

*   **Entrenador:** Puede crear equipos, gestionar jugadores, diseñar estrategias, guardarlas, y compartirlas con su equipo. También puede comentar en las estrategias.
*   **Jugador:** Puede unirse a equipos mediante un código, visualizar las estrategias compartidas por el entrenador, y añadir comentarios.

## Stack Tecnológico

*   **Backend:**
    *   Python 3.8+
    *   Django (última versión estable)
    *   Django REST Framework (para las APIs)
    *   djangorestframework-simplejwt (para autenticación basada en Tokens JWT)
    *   django-cors-headers (para manejar CORS)
*   **Frontend:**
    *   React (v18+) con TypeScript
    *   React Router DOM (para navegación)
    *   Konva.js & react-konva (para el tablero táctico interactivo)
    *   Axios (para peticiones HTTP)
    *   use-image (para cargar imágenes en Konva)
    *   jwt-decode (para decodificar tokens JWT en el cliente)
*   **Base de Datos:**
    *   SQLite (por defecto para desarrollo local)
    *   PostgreSQL (recomendado para producción)
*   **Control de Versiones:** Git

## Características Principales (MVP)

*   **Selección de Tipo de Campo:** Futsal, Fútbol 7, Fútbol 11.
*   **Tablero Interactivo:**
    *   Añadir y mover fichas de jugadores (locales/visitantes) con números/iniciales.
    *   Añadir y mover un balón.
    *   Dibujar líneas y flechas (con selección de color y grosor).
    *   Añadir notas de texto.
    *   Dibujar formas básicas (rectángulos, círculos) para destacar zonas.
    *   Borrar elementos individualmente o limpiar todo el tablero.
*   **Gestión de Estrategias:**
    *   Guardar estrategias con un nombre personalizado.
    *   Listar y cargar estrategias guardadas.
    *   Eliminar estrategias.
*   **Gestión de Equipos (Gratuito: 1 equipo por entrenador):**
    *   Entrenador puede crear un equipo y obtener un código único.
    *   Jugadores pueden unirse a un equipo usando el código.
    *   Entrenador puede ver y eliminar jugadores de su equipo.
*   **Colaboración:**
    *   Entrenador puede compartir estrategias con su equipo.
    *   Jugadores pueden visualizar las estrategias compartidas.
    *   Entrenadores y jugadores pueden añadir comentarios a las estrategias compartidas.

## Configuración del Entorno de Desarrollo

### Requisitos Previos

*   Python 3.8 o superior.
*   Node.js (v16 o superior) y npm (v8 o superior) o yarn.
*   Git (opcional, para clonar).

### Backend (Django)

1.  **Clonar el repositorio (si aplica):**
    \`\`\`bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_REPOSITORIO>
    \`\`\`

2.  **Navegar al directorio del backend:**
    \`\`\`bash
    cd pizarra_tactica_project
    \`\`\`

3.  **Crear y activar un entorno virtual:**
    \`\`\`bash
    python -m venv venv
    # En Windows:
    # venv\Scripts\activate
    # En macOS/Linux:
    source venv/bin/activate
    \`\`\`

4.  **Instalar dependencias:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`

5.  **Realizar migraciones de la base de datos:**
    \`\`\`bash
    python manage.py migrate
    \`\`\`

6.  **Crear un superusuario (opcional, para acceder al Admin Panel de Django):**
    \`\`\`bash
    python manage.py createsuperuser
    \`\`\`
    (Sigue las instrucciones. El script de configuración inicial ya crea un usuario 'admin' con contraseña 'adminpass' y rol 'entrenador').

7.  **Ejecutar el servidor de desarrollo Django:**
    \`\`\`bash
    python manage.py runserver
    \`\`\`
    El backend estará disponible en \`http://localhost:8000\`.

### Frontend (React)

1.  **Navegar al directorio del frontend (desde la raíz del proyecto):**
    \`\`\`bash
    cd frontend
    \`\`\`

2.  **Instalar dependencias:**
    \`\`\`bash
    npm install
    # o si prefieres yarn:
    # yarn install
    \`\`\`

3.  **Ejecutar la aplicación de desarrollo React:**
    \`\`\`bash
    npm start
    # o si prefieres yarn:
    # yarn start
    \`\`\`
    El frontend estará disponible en \`http://localhost:3000\` y se conectará automáticamente al backend en el puerto 8000.

## Estructura del Proyecto (Simplificada)

\`\`\`
.
├── pizarra_tactica_project/  # Directorio del proyecto Django (Backend)
│   ├── api/                  # Aplicación Django principal con modelos, vistas, serializers
│   ├── pizarra_tactica_project/ # Configuración del proyecto Django (settings.py, urls.py)
│   ├── manage.py             # Script de gestión de Django
│   └── requirements.txt      # Dependencias de Python
├── frontend/                 # Directorio del proyecto React (Frontend)
│   ├── public/
│   ├── src/
│   │   ├── assets/           # Imágenes, SVGs de campos
│   │   ├── components/       # Componentes reutilizables (UI, Layout, PrivateRoute)
│   │   ├── contexts/         # Contexto de Autenticación (AuthContext)
│   │   ├── hooks/            # Hooks personalizados (useAuth)
│   │   ├── pages/            # Componentes de página (HomePage, LoginPage, CrearEstrategiaPage, etc.)
│   │   ├── services/         # Lógica de API (api.ts, authService.ts, etc.)
│   │   └── types/            # Definiciones de TypeScript
│   ├── package.json
│   └── tsconfig.json
└── README.md                 # Este archivo
\`\`\`

## Endpoints Principales de la API (Backend en \`/api\`)

*   Autenticación:
    *   `POST /api/register/`: Registro de nuevos usuarios.
    *   `POST /api/token/`: Obtener token JWT (Login).
    *   `POST /api/token/refresh/`: Refrescar token JWT.
*   Equipos:
    *   `GET, POST /api/equipos/`: Listar equipos del usuario o crear un nuevo equipo (entrenador).
    *   `GET, PATCH, DELETE /api/equipos/<id>/`: Ver, actualizar o eliminar un equipo (entrenador).
    *   `POST /api/equipos/unirse/`: Jugador se une a un equipo con código.
    *   `POST /api/equipos/<equipo_pk>/gestionar_jugador/<jugador_pk>/`: Entrenador elimina jugador del equipo.
*   Estrategias:
    *   `GET, POST /api/estrategias/`: Listar estrategias o crear una nueva (entrenador).
    *   `GET, PATCH, DELETE /api/estrategias/<id>/`: Ver, actualizar (ej. compartir) o eliminar una estrategia.
*   Comentarios:
    *   `GET, POST /api/estrategias/<estrategia_pk>/comentarios/`: Listar o añadir comentarios a una estrategia.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios mayores o envía un Pull Request.

## Licencia

Este proyecto se distribuye bajo la Licencia MIT. Ver el archivo \`LICENSE\` para más detalles (actualmente no existe, se podría añadir).
