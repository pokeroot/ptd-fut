import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Equipo, getMisEquipos, crearEquipo, unirseAEquipo, eliminarJugadorDeEquipo, getEquipoDetalle } from '../services/equipoService'; // Asegúrate que la ruta sea correcta
import { User } from '../types/user'; // Asegúrate que la ruta sea correcta

const GestionEquipoPage: React.FC = () => {
  const { user } = useAuth();
  const [misEquipos, setMisEquipos] = useState<Equipo[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null);
  const [nombreNuevoEquipo, setNombreNuevoEquipo] = useState('');
  const [codigoParaUnirse, setCodigoParaUnirse] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cargarEquipos = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const equiposData = await getMisEquipos();
      setMisEquipos(equiposData);
      if (user.rol === 'entrenador' && equiposData.length > 0) {
        // Siempre cargar detalles del primer (y único para MVP) equipo del entrenador
        const detalles = await getEquipoDetalle(equiposData[0].id);
        setEquipoSeleccionado(detalles);
      } else if (user.rol === 'entrenador') {
        setEquipoSeleccionado(null); // No hay equipo, limpiar selección
      }
      // Para jugadores, misEquipos es suficiente por ahora.
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al cargar equipos.');
      console.error("Error en cargarEquipos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarEquipos();
  }, [cargarEquipos]);

  const handleCrearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevoEquipo.trim()) {
      setError("El nombre del equipo no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const nuevoEquipo = await crearEquipo(nombreNuevoEquipo);
      setMensaje('Equipo "\${nuevoEquipo.nombre}" creado con éxito. Código: \${nuevoEquipo.codigo_equipo} ');
      setNombreNuevoEquipo('');
      cargarEquipos(); // Recargar la lista de equipos
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || err.message || 'Error al crear el equipo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnirseAEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoParaUnirse.trim()) {
      setError("El código del equipo no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await unirseAEquipo(codigoParaUnirse);
      setMensaje(respuesta.mensaje);
      setCodigoParaUnirse('');
      cargarEquipos(); // Recargar la lista de equipos
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al unirse al equipo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarJugador = async (jugadorId: number) => {
    if (!equipoSeleccionado || !user || user.rol !== 'entrenador') return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar a este jugador del equipo?")) return;

    setIsLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await eliminarJugadorDeEquipo(equipoSeleccionado.id, jugadorId);
      setMensaje(respuesta.mensaje);
      // Recargar detalles del equipo seleccionado para actualizar lista de jugadores
      const detallesActualizados = await getEquipoDetalle(equipoSeleccionado.id);
      setEquipoSeleccionado(detallesActualizados);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al eliminar jugador.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener los IDs de los jugadores para el equipo seleccionado
  const jugadoresDelEquipoSeleccionado = equipoSeleccionado?.jugadores || [];
  const nombresJugadoresDelEquipoSeleccionado = equipoSeleccionado?.jugadores_username || [];


  if (isLoading && !misEquipos.length && !equipoSeleccionado) { // Mostrar cargando solo la primera vez
    return <p>Cargando gestión de equipos...</p>;
  }

  return (
    <div>
      <h2>Gestión de Equipos</h2>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user?.rol === 'entrenador' && (
        <>
          {(!misEquipos.length || misEquipos.length === 0) && !equipoSeleccionado && (
            <form onSubmit={handleCrearEquipo}>
              <h3>Crear Nuevo Equipo</h3>
              <div>
                <label htmlFor="nombreNuevoEquipo">Nombre del Equipo:</label>
                <input
                  type="text"
                  id="nombreNuevoEquipo"
                  value={nombreNuevoEquipo}
                  onChange={(e) => setNombreNuevoEquipo(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Equipo'}
              </button>
            </form>
          )}

          {equipoSeleccionado && (
            <div>
              <h3>Tu Equipo: {equipoSeleccionado.nombre}</h3>
              <p><strong>Código para compartir:</strong> {equipoSeleccionado.codigo_equipo}</p>
              <h4>Jugadores en el equipo:</h4>
              {nombresJugadoresDelEquipoSeleccionado.length > 0 ? (
                <ul>
                  {nombresJugadoresDelEquipoSeleccionado.map((nombre, index) => {
                    // Encontrar el ID del jugador correspondiente al nombre.
                    // Esto es un poco indirecto, sería mejor si el backend devolviera [{id: 1, username: 'test'}, ...]
                    // Por ahora, asumimos que el orden de jugadores y jugadores_username coincide.
                    const jugadorId = jugadoresDelEquipoSeleccionado[index];
                    return (
                      <li key={jugadorId || index}>
                        {nombre}
                        <button
                            onClick={() => handleEliminarJugador(jugadorId)}
                            disabled={isLoading}
                            style={{ marginLeft: '10px', background: 'red', fontSize: '0.8em', padding: '2px 5px'}}
                        >
                            Eliminar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Aún no hay jugadores en tu equipo.</p>
              )}
            </div>
          )}
        </>
      )}

      {user?.rol === 'jugador' && (
        <>
          <form onSubmit={handleUnirseAEquipo}>
            <h3>Unirse a un Equipo</h3>
            <div>
              <label htmlFor="codigoParaUnirse">Código del Equipo:</label>
              <input
                type="text"
                id="codigoParaUnirse"
                value={codigoParaUnirse}
                onChange={(e) => setCodigoParaUnirse(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Uniéndose...' : 'Unirse a Equipo'}
            </button>
          </form>

          <h3>Equipos a los que perteneces:</h3>
          {misEquipos.length > 0 ? (
            <ul>
              {misEquipos.map(eq => (
                <li key={eq.id}>{eq.nombre} (Entrenador: {eq.entrenador_propietario_username})</li>
              ))}
            </ul>
          ) : (
            <p>Aún no perteneces a ningún equipo.</p>
          )}
        </>
      )}
    </div>
  );
};

export default GestionEquipoPage;
