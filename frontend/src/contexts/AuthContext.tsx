import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct import for named export
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (newToken: string) => void;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token); // Type assertion for safety
        // Aquí deberías obtener los datos del usuario desde tu backend usando el token o el id del usuario
        // Por ahora, simulamos la obtención de datos del usuario desde el token (esto es simplificado)
        // En una app real, harías una petición a /api/user/me/ o similar.
        setUser({
            id: decodedToken.user_id, // Asegúrate que tu token JWT tenga 'user_id'
            username: decodedToken.username, // Asegúrate que tu token JWT tenga 'username'
            email: decodedToken.email || '', // Asegúrate que tu token JWT tenga 'email'
            rol: decodedToken.rol || 'jugador' // Asegúrate que tu token JWT tenga 'rol'
        });
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    // Decodificar token y setear usuario se maneja en el useEffect
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
