'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/config/api';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  clientId: string;
  createdAt: string;
  isFromBot: boolean;
  is_read?: boolean;
}

interface Client {
  id: string;
  telegramId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  notes?: string;
  isBlocked: boolean;
  lastMessage?: Message;
  photoUrl?: string;
  isDialogOpen?: boolean;
}

export default function ClientDialogPage({ params }: { params: { chatId: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { chatId } = params;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load client data
  const fetchClient = async () => {
    try {
      setIsLoadingClient(true);
      const data = await api.getClientById(chatId);
      setClient(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load client information');
      console.error('Error fetching client:', err);
    } finally {
      setIsLoadingClient(false);
    }
  };

  // Load messages
  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingMessages(true);
      else setIsRefreshing(true);
      
      const data = await api.getClientMessages(chatId);
      console.log('Received messages data:', data);
      // Transform data format to match Message interface
      const formattedMessages = data.map((m: any) => ({
        id: m.id,
        content: m.message_content || m.content || '',
        clientId: m.client_id || m.clientId || '',
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
        isFromBot: m.is_from_bot || m.isFromBot || false,
        is_read: m.is_read || false
      }));
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      
      // Только прокручиваем вниз при первой загрузке или при отправке сообщения
      if (showLoading) {
        setTimeout(scrollToBottom, 100);
      }

      // Mark messages as read
      const unreadMessageIds = data
        .filter((m: any) => !m.is_read && !(m.is_from_bot || m.isFromBot))
        .map((m: any) => m.id);

      if (unreadMessageIds.length > 0) {
        await api.markMessagesAsRead(unreadMessageIds);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
      else setIsRefreshing(false);
    }
  };

  // Ручное обновление сообщений
  const handleRefresh = () => {
    fetchMessages(false);
  };

  // Load data on component mount
  useEffect(() => {
    if (chatId) {
      fetchClient();
      fetchMessages();

      // Periodic update every 30 seconds
      const intervalId = setInterval(() => {
        fetchMessages(false);
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [chatId]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim()) return;

    try {
      await api.sendMessage({
        clientId: chatId,
        content: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  // Block/unblock client
  const handleToggleBlock = async () => {
    if (!client) return;

    try {
      await api.toggleClientBlock(chatId, !client.isBlocked);
      fetchClient(); // Update client data
    } catch (err: any) {
      setError(err.message || 'Failed to change client status');
      console.error('Error toggling block status:', err);
    }
  };

  // Update client notes
  const handleUpdateNotes = async (notes: string) => {
    try {
      await api.updateClientNotes(chatId, notes);
      fetchClient(); // Update client data
    } catch (err: any) {
      setError(err.message || 'Failed to update notes');
      console.error('Error updating notes:', err);
    }
  };

  // Toggle dialog status
  const handleToggleDialog = async () => {
    if (!client) return;

    try {
      await api.toggleDialogStatus(chatId, !client.isDialogOpen);
      setClient(prev => prev ? { ...prev, isDialogOpen: !prev.isDialogOpen } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to change dialog status');
      console.error('Error toggling dialog status:', err);
    }
  };

  if (isLoadingClient || isLoadingMessages) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dialog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col rounded-lg bg-white shadow dark:bg-gray-800">
      {/* Chat header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/dashboard/chats')}
            className="mr-4 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center flex-1">
            {client?.photoUrl ? (
              <img 
                src={client.photoUrl} 
                alt={client.firstName || client.username || 'Client'} 
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 mr-4">
                {client?.firstName ? client.firstName.charAt(0).toUpperCase() : 
                 client?.username ? client.username.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <div className="flex-1">
              {client ? (
                <>
                  <h2 className="text-lg font-medium">
                    {client.firstName} {client.lastName} 
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {client.username ? `@${client.username}` : `ID: ${client.telegramId}`}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      client.isBlocked
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {client.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      client.isDialogOpen
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {client.isDialogOpen ? 'Dialog Open' : 'Dialog Closed'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Client not found</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            
            {client && (
              <>
                <button
                  onClick={handleToggleDialog}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md
                    ${client.isDialogOpen 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                    }
                  `}
                >
                  {client.isDialogOpen ? 'Close Dialog' : 'Open Dialog'}
                </button>
                
                <button
                  onClick={handleToggleBlock}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md
                    ${client.isBlocked 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                    }
                  `}
                >
                  {client.isBlocked ? 'Unblock Client' : 'Block Client'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.isFromBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] ${
                  message.isFromBot
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'bg-blue-500 text-white dark:bg-blue-600'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <span className="mt-1 block text-right text-xs text-gray-500 dark:text-gray-400">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-2 text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={client?.isDialogOpen ? "Type your message..." : "Dialog is closed. Open it to send messages."}
            disabled={!client?.isDialogOpen}
            className="flex-1 rounded-l-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!client?.isDialogOpen || !newMessage.trim()}
            className="rounded-r-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}