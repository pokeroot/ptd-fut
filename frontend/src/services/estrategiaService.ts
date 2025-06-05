import api from './api';
import { ElementoTablero } from '../pages/CrearEstrategiaPage'; // Asumiendo que exportas este tipo

export interface EstrategiaData {
  id?: number;
  nombre: string;
  tipo_campo: 'Futsal' | 'Futbol_7' | 'Futbol_11';
  datos_estrategia: { elementos: ElementoTablero[] }; // El JSON que guardaremos
  equipo: number; // ID del equipo
  creador_username?: string;
  compartida_con_equipo?: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export const guardarEstrategia = async (datosEstrategia: EstrategiaData): Promise<EstrategiaData> => {
  // Si la estrategia tiene un ID, es una actualización (PATCH o PUT)
  // Por ahora, el PDD dice que la edición es post-MVP, así que solo crearemos nuevas.
  // Para simplificar el MVP, si se guarda con el mismo nombre, el backend podría manejarlo o podríamos pedir confirmación para sobrescribir.
  // Aquí implementamos solo la creación.
  const response = await api.post<EstrategiaData>('/estrategias/', datosEstrategia);
  return response.data;
};

export const getMisEstrategias = async (): Promise<EstrategiaData[]> => {
  const response = await api.get<EstrategiaData[]>('/estrategias/');
  return response.data;
};

export const getEstrategiaPorId = async (id: number): Promise<EstrategiaData> => {
  const response = await api.get<EstrategiaData>(`/estrategias/${id}/`);
  return response.data;
};

export const deleteEstrategia = async (id: number): Promise<void> => {
  await api.delete(`/estrategias/${id}/`);
};

export const actualizarEstadoCompartirEstrategia = async (id: number, compartida: boolean): Promise<EstrategiaData> => {
  const response = await api.patch<EstrategiaData>(`/estrategias/${id}/`, { compartida_con_equipo: compartida });
  return response.data;
};
