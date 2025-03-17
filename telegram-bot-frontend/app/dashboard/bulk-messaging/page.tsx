'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/src/config/api';

interface Flow {
  id: number;
  name: string;
  description: string;
}

export default function BulkMessagingPage() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedFlow, setSelectedFlow] = useState('');
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientCount, setClientCount] = useState({ all: 0, ru: 0, en: 0 });
  const [activeTab, setActiveTab] = useState('message');

  // Загрузка списка сценариев
  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const data = await fetchApi(API_ENDPOINTS.flows);
        setFlows(data);
      } catch (error) {
        console.error('Error fetching flows:', error);
        alert('Failed to load flows');
      }
    };

    fetchFlows();
  }, []);

  // Загрузка количества клиентов
  useEffect(() => {
    const fetchClientCounts = async () => {
      try {
        // Получаем общее количество клиентов
        const allClients = await fetchApi(API_ENDPOINTS.clients);
        
        // Фильтруем по языкам
        const ruClients = allClients.filter((client: any) => client.language === 'ru');
        const enClients = allClients.filter((client: any) => client.language === 'en');
        
        setClientCount({
          all: allClients.length,
          ru: ruClients.length,
          en: enClients.length
        });
      } catch (error) {
        console.error('Error fetching client counts:', error);
      }
    };

    fetchClientCounts();
  }, []);

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      let response;
      
      if (selectedLanguage === 'all') {
        // Отправка всем клиентам
        response = await fetchApi(`${API_ENDPOINTS.clients}/bulk-message`, {
          method: 'POST',
          body: JSON.stringify({ message })
        });
      } else {
        // Отправка клиентам с выбранным языком
        response = await fetchApi(`${API_ENDPOINTS.clients}/language/${selectedLanguage}/message`, {
          method: 'POST',
          body: JSON.stringify({ message })
        });
      }
      
      alert(`Message sent to ${response.sentCount} clients`);
      
      setMessage('');
    } catch (error) {
      console.error('Error sending bulk message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Отправка сценария
  const handleSendFlow = async () => {
    if (!selectedFlow) return;
    
    setLoading(true);
    try {
      let response;
      
      if (selectedLanguage === 'all') {
        // Отправка всем клиентам
        response = await fetchApi(`${API_ENDPOINTS.flows}/${selectedFlow}/invite-all`, {
          method: 'POST'
        });
      } else {
        // Отправка клиентам с выбранным языком
        response = await fetchApi(`${API_ENDPOINTS.clients}/language/${selectedLanguage}/flow`, {
          method: 'POST',
          body: JSON.stringify({ flowId: selectedFlow })
        });
      }
      
      alert(`Flow sent to ${response.sentCount} clients`);
    } catch (error) {
      console.error('Error sending bulk flow:', error);
      alert('Failed to send flow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{t('bulk.title')}</h1>
      
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">{t('bulk.selectLanguage')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {selectedLanguage === 'all' 
            ? `All clients (${clientCount.all})` 
            : selectedLanguage === 'ru' 
              ? `Russian speaking clients (${clientCount.ru})` 
              : `English speaking clients (${clientCount.en})`}
        </p>
        <select 
          value={selectedLanguage} 
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All ({clientCount.all})</option>
          <option value="ru">Russian ({clientCount.ru})</option>
          <option value="en">English ({clientCount.en})</option>
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 ${activeTab === 'message' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('message')}
          >
            Send Message
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'flow' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('flow')}
          >
            Send Flow
          </button>
        </div>
      </div>
      
      {activeTab === 'message' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('bulk.messageText')}</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="w-full min-h-[200px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || loading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600"
          >
            {loading ? 'Sending...' : selectedLanguage === 'all' ? t('bulk.sendToAll') : t('bulk.sendToLanguage')}
          </button>
        </div>
      )}
      
      {activeTab === 'flow' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('bulk.selectFlow')}</h2>
          <select
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
          >
            <option value="" disabled>Select a flow</option>
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id.toString()}>
                {flow.name}
              </option>
            ))}
          </select>
          <button 
            onClick={handleSendFlow} 
            disabled={!selectedFlow || loading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600"
          >
            {loading ? 'Sending...' : t('bulk.sendFlow')}
          </button>
        </div>
      )}
    </div>
  );
} 