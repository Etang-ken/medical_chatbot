export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface MedicalKnowledge {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  label: number;
}

export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
}

export interface ChatResponse {
  chatId: string;
  message: Message;
}
