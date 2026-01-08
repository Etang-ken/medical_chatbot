import prisma from '../config/database.js';
import { generateAIResponse } from './aiService.js';
import type { Chat, Message, ChatRequest, ChatResponse } from '../types/index.js';

export async function getUserChats(userId: string): Promise<Chat[]> {
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return chats.map((chat: any) => ({
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  }));
}

export async function getChatMessages(chatId: string, userId: string): Promise<Message[]> {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  return chat.messages.map((msg: any) => ({
    id: msg.id,
    chatId: msg.chatId,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  }));
}

export async function createChat(userId: string, title?: string): Promise<Chat> {
  const chat = await prisma.chat.create({
    data: {
      userId,
      title: title || 'New Chat',
    },
  });

  return {
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

export async function sendMessage(
  userId: string,
  data: ChatRequest
): Promise<ChatResponse> {
  const { message, chatId } = data;

  let chat: Chat;

  if (chatId) {
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!existingChat) {
      throw new Error('Chat not found');
    }

    chat = {
      id: existingChat.id,
      title: existingChat.title,
      userId: existingChat.userId,
      createdAt: existingChat.createdAt,
      updatedAt: existingChat.updatedAt,
    };
  } else {
    const firstWords = message.split(' ').slice(0, 5).join(' ');
    const title = firstWords.length > 50 ? firstWords.substring(0, 50) + '...' : firstWords;
    chat = await createChat(userId, title);
  }

  const userMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: 'user',
      content: message,
    },
  });

  const recentMessages = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const chatHistory = recentMessages.reverse().map((msg: any) => ({
    id: msg.id,
    chatId: msg.chatId,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  }));

  const aiResponseText = await generateAIResponse(message, chatHistory.slice(0, -1));

  const aiMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      role: 'assistant',
      content: aiResponseText,
    },
  });

  await prisma.chat.update({
    where: { id: chat.id },
    data: { updatedAt: new Date() },
  });

  return {
    chatId: chat.id,
    message: {
      id: aiMessage.id,
      chatId: aiMessage.chatId,
      role: 'assistant',
      content: aiMessage.content,
      createdAt: aiMessage.createdAt,
    },
  };
}

export async function deleteChat(chatId: string, userId: string): Promise<void> {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  await prisma.chat.delete({
    where: { id: chatId },
  });
}
