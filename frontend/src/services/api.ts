import axios from 'axios';
import type { User, Chat, Message, AuthResponse, ChatResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/signup', { email, password, name });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  me: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data;
  },
};

export const chatApi = {
  getChats: async (): Promise<Chat[]> => {
    const { data } = await api.get<{ chats: Chat[] }>('/chats');
    return data.chats;
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    const { data } = await api.get<{ messages: Message[] }>(`/chats/${chatId}/messages`);
    return data.messages;
  },

  createChat: async (title?: string): Promise<Chat> => {
    const { data } = await api.post<{ chat: Chat }>('/chats', { title });
    return data.chat;
  },

  sendMessage: async (message: string, chatId?: string): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chats/message', { message, chatId });
    return data;
  },

  deleteChat: async (chatId: string): Promise<void> => {
    await api.delete(`/chats/${chatId}`);
  },
};

export default api;
