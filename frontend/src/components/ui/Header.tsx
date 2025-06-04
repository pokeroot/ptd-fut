import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{ background: '#333', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>Pizarra Táctica</Link>
      <nav>
        {user ? (
          <>
            <span style={{ marginRight: '1rem' }}>Hola, {user.username} ({user.rol})</span>
            <button onClick={logout}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', marginRight: '1rem' }}>Iniciar Sesión</Link>
            <Link to="/register" style={{ color: 'white' }}>Registrarse</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
