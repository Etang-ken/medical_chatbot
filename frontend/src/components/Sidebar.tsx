import { MessageSquare, Plus, Trash2, LogOut } from 'lucide-react';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import type { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
  userName?: string;
}

function groupChatsByDate(chats: Chat[]) {
  const groups: { [key: string]: Chat[] } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  chats.forEach((chat) => {
    const date = new Date(chat.updatedAt);
    if (isToday(date)) {
      groups.Today.push(chat);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(chat);
    } else if (isThisWeek(date)) {
      groups['This Week'].push(chat);
    } else {
      groups.Older.push(chat);
    }
  });

  return groups;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onLogout,
  userName,
}: SidebarProps) {
  const groupedChats = groupChatsByDate(chats);

  return (
    <div className="w-80 bg-medical-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-medical-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-medical-700 hover:bg-medical-600 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedChats).map(([group, groupChats]) => {
          if (groupChats.length === 0) return null;

          return (
            <div key={group} className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-medical-300 uppercase tracking-wider">
                {group}
              </div>
              <div className="space-y-1 px-2">
                {groupChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-medical-700 text-white'
                        : 'text-medical-200 hover:bg-medical-800'
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{chat.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-medical-600 rounded transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-medical-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-medical-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-medical-200">{userName || 'User'}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-medical-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
