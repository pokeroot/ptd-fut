import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMisEstrategias, deleteEstrategia, actualizarEstadoCompartirEstrategia, EstrategiaData } from '../services/estrategiaService';

const MisEstrategiasPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estrategias, setEstrategias] = useState<EstrategiaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarEstrategias = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMisEstrategias();
      setEstrategias(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al cargar estrategias.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === 'entrenador') {
      cargarEstrategias();
    } else {
      setIsLoading(false);
      setError("Acceso no autorizado.");
    }
  }, [user, cargarEstrategias]);

  const handleEliminarEstrategia = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta estrategia?")) return;
    // ... (lógica de eliminar sin cambios)
    setIsLoading(true); setError(null); setMensaje(null);
    try {
      await deleteEstrategia(id);
      setMensaje("Estrategia eliminada con éxito.");
      cargarEstrategias();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al eliminar la estrategia.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompartir = async (estrategia: EstrategiaData) => {
    setIsLoading(true); setError(null); setMensaje(null);
    try {
      const actualizada = await actualizarEstadoCompartirEstrategia(estrategia.id!, !estrategia.compartida_con_equipo);
      setMensaje(\`Estrategia "\${actualizada.nombre}" ahora está \${actualizada.compartida_con_equipo ? "compartida" : "no compartida"}.\`);
      // Actualizar la lista localmente para reflejar el cambio inmediatamente
      setEstrategias(prev => prev.map(e => e.id === actualizada.id ? actualizada : e));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al cambiar estado de compartir.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && estrategias.length === 0) return <p>Cargando mis estrategias...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (user?.rol !== 'entrenador') return <p>No tienes permiso para ver esta página.</p>;

  return (
    <div>
      <h2>Mis Estrategias Guardadas</h2>
      {mensaje && <p style={{color: 'green'}}>{mensaje}</p>}
      <Link to="/crear-estrategia">
        <button style={{ marginBottom: '20px'  }} disabled={isLoading}>Crear Nueva Estrategia</button>
      </Link>
      {estrategias.length === 0 ? (
        <p>Aún no has guardado ninguna estrategia.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {estrategias.map(est => (
            <li key={est.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <strong>{est.nombre}</strong> (Campo: {est.tipo_campo.replace('_', ' ')})
                  {est.compartida_con_equipo && <span style={{ marginLeft:'10px', color: 'green', fontWeight:'bold' }}>(Compartida)</span>}
                  <br />
                  <small>Última modificación: {new Date(est.fecha_modificacion || est.fecha_creacion || Date.now()).toLocaleDateString()}</small>
                </div>
                <div>
                  <button onClick={() => handleToggleCompartir(est)} style={{ marginRight: '10px' }} disabled={isLoading}>
                    {est.compartida_con_equipo ? 'Dejar de Compartir' : 'Compartir con Equipo'}
                  </button>
                  <button onClick={() => navigate(\`/crear-estrategia/\${est.id}\`)} style={{ marginRight: '10px' }} disabled={isLoading}>
                    Ver/Editar
                  </button>
                  <button onClick={() => handleEliminarEstrategia(est.id!)} style={{ background: 'red' }} disabled={isLoading}>
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default MisEstrategiasPage;
