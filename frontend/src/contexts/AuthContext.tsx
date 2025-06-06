import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Añadir useCallback
import { jwtDecode } from 'jwt-decode';
import { User } from '../types/user';
import { getUserProfile } from '../services/authService'; // NUEVA IMPORTACIÓN
// Asegúrate que api service también esté importado si necesitas manejar errores de axios directamente aquí
// import api from '../services/api'; 

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (newToken: string) => Promise<void>; // login puede ser async ahora
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true); // Sigue siendo true inicialmente

  const loadUser = useCallback(async () => {
    if (!token) { // Si no hay token, no intentes cargar (aunque useEffect ya lo chequea)
        setLoading(false); // Termina la carga si no hay token
        return;
    }
    // setLoading(true); // Opcional: si quieres un estado de carga específico para esto
    try {
      const userData = await getUserProfile(); // Llama al endpoint /users/me/
      setUser(userData); // Establece el usuario con los datos del backend
    } catch (error: any) { // Especificar 'any' o un tipo de error más específico
      console.error('Error al cargar datos del usuario o token inválido:', error);
      // Si el error es por token inválido (ej. 401), el interceptor de api.ts 
      // ya podría marcar error.isAuthError = true.
      // O puedes chequear error.response.status === 401 aquí si es necesario.
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false); // Termina la carga después del intento
    }
  }, [token]); // Depende de token, si token cambia, se podría re-ejecutar si se llama explícitamente

  useEffect(() => {
    if (token) {
      // Validar la estructura básica del token (expiración) antes de cargar el usuario.
      // jwtDecode no valida la firma, solo decodifica. La validación de firma la hace el backend.
      try {
        const decodedToken: { exp: number } = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) { // Token expirado
          console.log("Token expirado en useEffect");
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
          setLoading(false);
        } else {
          loadUser(); // Carga los datos del usuario desde el backend
        }
      } catch (error) { // Error al decodificar (token malformado)
        console.error("Token malformado:", error);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false); // No hay token, no hay nada que cargar
    }
  }, [token, loadUser]); // loadUser es ahora una dependencia de useEffect

  const login = async (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken); // Esto disparará el useEffect que llamará a loadUser
    // Opcionalmente, para una UI más rápida, puedes llamar a loadUser() aquí también,
    // pero useEffect ya lo hará. Si lo llamas aquí, asegúrate de que loadUser
    // no cause doble estado de carga si setLoading(true) está dentro de loadUser.
    // Por simplicidad, confiar en useEffect es más limpio.
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
