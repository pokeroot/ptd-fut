export interface User {
  id: number;
  username: string;
  email: string;
  rol: 'entrenador' | 'jugador';
  first_name?: string;
  last_name?: string;
}
