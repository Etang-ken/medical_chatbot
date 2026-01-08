import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import EmptyState from '../components/EmptyState';
import type { Message } from '../types';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getChats,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', currentChatId],
    queryFn: () => chatApi.getMessages(currentChatId!),
    enabled: !!currentChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ message, chatId }: { message: string; chatId?: string }) =>
      chatApi.sendMessage(message, chatId),
    onMutate: async ({ message, chatId }) => {
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: chatId || 'new',
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      };

      if (chatId) {
        await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
        const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);
        queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => [
          ...old,
          tempUserMessage,
        ]);
        return { previousMessages };
      }
    },
    onSuccess: (data) => {
      setCurrentChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.chatId] });
    },
    onError: (_error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages);
      }
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: chatApi.deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setCurrentChatId(null);
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate({ message, chatId: currentChatId || undefined });
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showEmptyState = !currentChatId && messages.length === 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onLogout={logout}
        userName={user?.name || user?.email}
      />

      <div className="flex-1 flex flex-col">
        {showEmptyState ? (
          <EmptyState />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-medical-600" size={40} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-medical-700 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={20} />
                    </div>
                    <div className="flex-1 max-w-3xl">
                      <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-tl-sm">
                        <p className="text-gray-500">Thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        <ChatInput
          onSend={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
