import api from './api';
import { User } from '../types/user'; // Asumiendo que tienes este tipo

export interface Equipo {
  id: number;
  nombre: string;
  codigo_equipo: string;
  entrenador_propietario: number; // ID del usuario entrenador
  entrenador_propietario_username: string;
  jugadores: number[]; // IDs de usuarios jugadores
  jugadores_username: string[];
}

export const crearEquipo = async (nombreEquipo: string): Promise<Equipo> => {
  const response = await api.post<Equipo>('/equipos/', { nombre: nombreEquipo });
  return response.data;
};

export const getMisEquipos = async (): Promise<Equipo[]> => {
  const response = await api.get<Equipo[]>('/equipos/');
  return response.data;
};

export const getEquipoDetalle = async (equipoId: number): Promise<Equipo> => {
  const response = await api.get<Equipo>(`/equipos/\${equipoId}/`);
  return response.data;
};

export const unirseAEquipo = async (codigoEquipo: string): Promise<{mensaje: string, equipo: Equipo}> => {
  const response = await api.post<{mensaje: string, equipo: Equipo}>('/equipos/unirse/', { codigo_equipo: codigoEquipo });
  return response.data;
};

export const eliminarJugadorDeEquipo = async (equipoId: number, jugadorId: number): Promise<{mensaje: string}> => {
  const response = await api.post<{mensaje: string}>(`/equipos/\${equipoId}/gestionar_jugador/\${jugadorId}/`, {}); // POST para remover
  return response.data;
};

// Actualizar nombre del equipo (si es necesario)
export const actualizarNombreEquipo = async (equipoId: number, nuevoNombre: string): Promise<Equipo> => {
    const response = await api.patch<Equipo>(`/equipos/\${equipoId}/`, { nombre: nuevoNombre });
    return response.data;
};
