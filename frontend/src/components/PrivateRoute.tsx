import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando autenticación...</div>; // O un spinner
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
