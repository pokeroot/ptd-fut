import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMisEstrategias, EstrategiaData } from '../services/estrategiaService'; // getMisEstrategias aquí listará las compartidas para el jugador

const EstrategiasEquipoPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estrategias, setEstrategias] = useState<EstrategiaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstrategiasCompartidas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // El backend ya filtra para devolver solo las estrategias compartidas
      // de los equipos a los que pertenece el jugador.
      const data = await getMisEstrategias();
      setEstrategias(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al cargar estrategias del equipo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === 'jugador') {
      cargarEstrategiasCompartidas();
    } else {
      setIsLoading(false);
      // Podría redirigir o mostrar un mensaje si un entrenador accede aquí por error
      // setError("Esta vista es para jugadores.");
    }
  }, [user, cargarEstrategiasCompartidas]);

  if (isLoading) {
    return <p>Cargando estrategias del equipo...</p>;
  }
  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }
   if (user?.rol !== 'jugador') {
      return <p>No tienes permiso para ver esta página. Esta sección es para jugadores.</p>;
  }


  return (
    <div>
      <h2>Estrategias Compartidas por el Entrenador</h2>
      {estrategias.length === 0 ? (
        <p>El entrenador aún no ha compartido ninguna estrategia contigo o con tus equipos.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {estrategias.map(est => (
            <li key={est.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{est.nombre}</strong> (Campo: {est.tipo_campo.replace('_', ' ')})
                <br />
                <small>Compartida por: {est.creador_username || 'Entrenador'}</small>
              </div>
              <button onClick={() => navigate('/visualizar-estrategia/\${est.id}')}>
                Visualizar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default EstrategiasEquipoPage;
