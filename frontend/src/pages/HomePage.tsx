import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Bienvenido a la Pizarra Táctica Digital</h1>
      {user ? (
        <div>          <p>Estás conectado como {user.username} ({user.rol}).</p>          <p><Link to="/gestion-equipo"><button>Gestionar Equipos</button></Link></p>          {user.rol === "entrenador" && (            <>              <Link to="/crear-estrategia">                <button style={{ marginTop: "10px", marginRight: "10px" }}>Crear Nueva Estrategia</button>              </Link>              <Link to="/mis-estrategias">                <button style={{ marginTop: "10px" }}>Mis Estrategias Guardadas</button>              </Link>            </>          )}          {user.rol === "jugador" && (            <Link to="/estrategias-equipo">              <button style={{ marginTop: "10px" }}>Ver Estrategias del Equipo</button>            </Link>          )}          {/* Aquí irán más elementos del dashboard */}        </div>
      ) : (
        <p>Por favor, <Link to="/login">inicia sesión</Link> o <Link to="/register">regístrate</Link> para continuar.</p>
      )}
    </div>
  );
};

export default HomePage;
