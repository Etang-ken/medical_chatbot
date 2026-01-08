import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getUserChats,
  getChatMessages,
  createChat,
  sendMessage,
  deleteChat,
} from '../services/chatService.js';
import type { ChatRequest } from '../types/index.js';

export async function getChatsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const chats = await getUserChats(userId);
    res.status(200).json({ chats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get chats';
    res.status(500).json({ error: message });
  }
}

export async function getMessagesController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;

    const messages = await getChatMessages(chatId, userId);
    res.status(200).json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    res.status(404).json({ error: message });
  }
}

export async function createChatController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title } = req.body;

    const chat = await createChat(userId, title);
    res.status(201).json({ chat });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create chat';
    res.status(500).json({ error: message });
  }
}

export async function sendMessageController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { message, chatId } = req.body as ChatRequest;

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = await sendMessage(userId, { message, chatId });
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    res.status(500).json({ error: message });
  }
}

export async function deleteChatController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;

    await deleteChat(chatId, userId);
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete chat';
    res.status(404).json({ error: message });
  }
}
