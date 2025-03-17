'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/app/config/api';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import TicketModal from '@/app/components/TicketModal';
import { useRouter } from 'next/navigation';

interface Client {
  id: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

interface Operator {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  client_id: number;
  status: string;
  priority: string;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  assignedOperator?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export default function TicketsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Загрузка заявок
  useEffect(() => {
    fetchTickets();
  }, []);

  // Фильтрация заявок при изменении поискового запроса или фильтров
  useEffect(() => {
    filterTickets();
  }, [searchTerm, statusFilter, priorityFilter, tickets]);

  // Загрузка заявок
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi(API_ENDPOINTS.tickets);
      setTickets(response);
      setFilteredTickets(response);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтрация заявок
  const filterTickets = () => {
    let filtered = [...tickets];
    
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        ticket.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
        ticket.client?.first_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        ticket.client?.last_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        ticket.client?.username?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    setFilteredTickets(filtered);
  };

  // Обработка закрытия модальных окон
  const handleModalClose = (refreshData = false) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTicket(null);
    
    if (refreshData) {
      fetchTickets();
    }
  };

  // Открытие окна редактирования
  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  // Удаление заявки
  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm(t('tickets.confirmDelete'))) {
      return;
    }
    
    try {
      await fetchApi(`${API_ENDPOINTS.tickets}/${ticketId}`, {
        method: 'DELETE'
      });
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert(t('tickets.errorDeleting'));
    }
  };

  // Получение класса цвета в зависимости от приоритета
  const getPriorityColorClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Получение класса цвета в зависимости от статуса
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-itm-text-primary">{t('Tickets') || 'Tickets'}</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-itm-dark-highlight dark:hover:bg-itm-dark-accent text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> {t('Create Ticket') || 'Create Ticket'}
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="mb-6">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('Search tickets...') || 'Search tickets...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 pr-4 border border-gray-300 dark:border-itm-border rounded-md bg-white dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-itm-text-secondary" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-itm-dark-accent dark:hover:bg-gray-700 text-gray-700 dark:text-itm-text-primary px-4 py-2 rounded-md flex items-center"
          >
            <FaFilter className="mr-2" /> {t('Filters') || 'Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-itm-dark-secondary rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-itm-text-secondary mb-1">
                  {t('Status') || 'Status'}
                </label>
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  className="w-full p-2 border border-gray-300 dark:border-itm-border rounded-md bg-white dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
                >
                  <option value="">{t('All Statuses') || 'All Statuses'}</option>
                  <option value="open">{t('Open') || 'Open'}</option>
                  <option value="in_progress">{t('In Progress') || 'In Progress'}</option>
                  <option value="resolved">{t('Resolved') || 'Resolved'}</option>
                  <option value="closed">{t('Closed') || 'Closed'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-itm-text-secondary mb-1">
                  {t('Priority') || 'Priority'}
                </label>
                <select
                  value={priorityFilter || ''}
                  onChange={(e) => setPriorityFilter(e.target.value || null)}
                  className="w-full p-2 border border-gray-300 dark:border-itm-border rounded-md bg-white dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
                >
                  <option value="">{t('All Priorities') || 'All Priorities'}</option>
                  <option value="low">{t('Low') || 'Low'}</option>
                  <option value="medium">{t('Medium') || 'Medium'}</option>
                  <option value="high">{t('High') || 'High'}</option>
                  <option value="critical">{t('Critical') || 'Critical'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center text-gray-500 p-4">
          {searchTerm || statusFilter || priorityFilter 
            ? t('tickets.noSearchResults') 
            : t('tickets.noTickets')}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-itm-dark-secondary rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-itm-border">
            <thead className="bg-gray-50 dark:bg-itm-dark-accent">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Title') || 'Title'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Client') || 'Client'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Status') || 'Status'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Priority') || 'Priority'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Assigned To') || 'Assigned To'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Created') || 'Created'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                  {t('Actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-itm-dark-secondary divide-y divide-gray-200 dark:divide-itm-border">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-itm-dark-accent">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-itm-text-primary">{ticket.title}</div>
                    <div className="text-sm text-gray-500 dark:text-itm-text-secondary truncate max-w-xs">{ticket.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-itm-text-primary">
                      {ticket.client ? 
                        `${ticket.client.first_name} ${ticket.client.last_name}` : 
                        'Unknown Client'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-itm-text-secondary">
                      {ticket.client?.username ? `@${ticket.client.username}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(ticket.status)}`}>
                      {t(`tickets.statuses.${ticket.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColorClass(ticket.priority)}`}>
                      {t(`tickets.priorities.${ticket.priority}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.assignedOperator ? (
                      <div>
                        {ticket.assignedOperator.first_name} {ticket.assignedOperator.last_name}
                        {ticket.assignedOperator.username && (
                          <div className="text-sm text-gray-500 dark:text-itm-text-secondary">
                            @{ticket.assignedOperator.username}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-itm-text-secondary">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditTicket(ticket)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title={t('common.edit')}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно создания заявки */}
      <TicketModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        isCreating={true}
      />

      {/* Модальное окно редактирования заявки */}
      <TicketModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        initialTicket={selectedTicket}
        isCreating={false}
      />
    </div>
  );
} 