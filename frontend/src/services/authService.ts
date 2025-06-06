import api from './api';
import { User } from '../types/user';

interface LoginResponse {
  access: string;
  refresh: string;
}

export const loginUser = async (credentials: any) => {
  const response = await api.post<LoginResponse>('/token/', credentials);
  return response.data;
};

export const registerUser = async (userData: any) => {
  const response = await api.post<User>('/register/', userData);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<User>('/users/me/');
  return response.data;
};
