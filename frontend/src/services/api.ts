import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // URL base de tu API Django
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendError = error.response?.data;
    let message = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.';

    if (error.response) {
      // Si es un error 401, el token podría haber expirado o ser inválido.
      if (error.response.status === 401) {
        message = "Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.";
        // Marcar el error para que pueda ser manejado específicamente por el AuthContext o componentes.
        error.isAuthError = true;
      } else if (backendError) { // Para otros errores con respuesta del backend
        if (backendError.detail) {
          message = backendError.detail;
        } else if (typeof backendError === 'string') {
          message = backendError;
        } else if (Array.isArray(backendError) && backendError.length > 0 && typeof backendError[0] === 'string') {
          message = backendError[0];
        } else if (typeof backendError === 'object') {
          const fieldErrors = Object.values(backendError).flat();
          if (fieldErrors.length > 0) {
            message = fieldErrors.join(' ');
          }
        }
      } else { // No hay backendError.data específico, usar status code para generar mensaje
         switch (error.response.status) {
            case 400: message = "Petición incorrecta."; break;
            // 401 ya cubierto y marcado con isAuthError
            case 403: message = "No tienes permiso para realizar esta acción."; break;
            case 404: message = "El recurso solicitado no fue encontrado."; break;
            case 500: message = "Error interno del servidor. Por favor, inténtalo más tarde."; break;
            default: message = \`Error del servidor: \${error.response.status}. Inténtalo más tarde.\`;
        }
      }
    } else if (error.request) { // La petición se hizo pero no se recibió respuesta (error de red)
      message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.';
    }

    // Adjuntar el mensaje amigable al objeto de error para que la UI pueda usarlo.
    error.friendlyMessage = message;

    return Promise.reject(error);
  }
);

export default api;
