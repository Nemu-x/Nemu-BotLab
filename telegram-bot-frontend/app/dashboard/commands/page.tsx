'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/src/config/api';

interface Command {
  id: string;
  name: string;
  response: string;
  is_active: boolean;
  type: 'text' | 'slash' | 'regex';
  matchType?: 'exact' | 'contains' | 'regex';
  priority?: number;
  action?: {
    type: 'cancel_flow' | 'start_flow' | 'send_message' | 'send_flow_invitation';
    flowId?: number;
    message?: string;
    parse_mode?: string;
  } | null;
}

interface NewCommand {
  name: string;
  response: string;
  type: 'text' | 'slash' | 'regex';
  matchType: 'exact' | 'contains' | 'regex';
  priority: number;
  action: {
    type: 'cancel_flow' | 'start_flow' | 'send_message' | 'send_flow_invitation';
    flowId?: number;
    message?: string;
    parse_mode?: string;
  } | null;
}

// Функция для получения matchType с учетом возможного undefined
const getMatchType = (cmd: Command): 'exact' | 'contains' | 'regex' => {
  return cmd.matchType || 'contains';
};

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCommand, setNewCommand] = useState<NewCommand>({
    name: '',
    response: '',
    type: 'text',
    matchType: 'exact',
    priority: 0,
    action: null
  });

  // Fetch commands - оптимизировано с useCallback
  const fetchCommands = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCommands();
      setCommands(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  // Add new command - оптимизировано с useCallback
  const handleAddCommand = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addCommand(newCommand);
      setNewCommand({
        name: '',
        response: '',
        type: 'text',
        matchType: 'exact',
        priority: 0,
        action: null
      });
      fetchCommands();
    } catch (err: any) {
      setError(err.message || 'Failed to add command');
    }
  }, [newCommand, fetchCommands]);

  // Toggle command status - оптимизировано с useCallback
  const handleToggleStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const command = commands.find(c => c.id === id);
      if (command) {
        await api.updateCommand(id, {
          ...command,
          is_active: !isActive
        });
        fetchCommands();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update command');
    }
  }, [commands, fetchCommands]);

  // Delete command - оптимизировано с useCallback
  const handleDeleteCommand = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this command?')) return;
    
    try {
      console.log(`Deleting command with ID: ${id}`);
      const response = await api.deleteCommand(id);
      console.log('Delete response:', response);
      
      // Обновляем состояние локально, чтобы не ждать нового запроса
      setCommands(prevCommands => prevCommands.filter(c => c.id !== id));
      
      // Затем все равно обновляем с сервера для синхронизации
      fetchCommands();
      setError(null);
    } catch (err: any) {
      console.error('Error deleting command:', err);
      setError(err.message || 'Failed to delete command');
    }
  }, [fetchCommands]);

  // Мемоизируем отфильтрованные команды для оптимизации производительности
  const activeCommands = useMemo(() => commands.filter(c => c.is_active), [commands]);
  const inactiveCommands = useMemo(() => commands.filter(c => !c.is_active), [commands]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Commands</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Add new command form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Add New Command</h2>
        <form onSubmit={handleAddCommand} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Command Type
            </label>
            <select
              value={newCommand.type}
              onChange={(e) => setNewCommand({ ...newCommand, type: e.target.value as Command['type'] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="text">Text Command</option>
              <option value="slash">Slash Command</option>
              <option value="regex">Regex Command</option>
            </select>
          </div>

          {newCommand.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Match Type
              </label>
              <select
                value={newCommand.matchType}
                onChange={(e) => setNewCommand({ ...newCommand, matchType: e.target.value as 'exact' | 'contains' | 'regex' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Priority
            </label>
            <input
              type="number"
              value={newCommand.priority}
              onChange={(e) => setNewCommand({ ...newCommand, priority: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              min="0"
              required
            />
          </div>

          {newCommand.type === 'slash' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Special Action
              </label>
              <select
                value={newCommand.action ? newCommand.action.type : ''}
                onChange={(e) => {
                  const actionType = e.target.value;
                  if (!actionType) {
                    setNewCommand({ ...newCommand, action: null });
                  } else {
                    setNewCommand({
                      ...newCommand,
                      action: {
                        type: actionType as 'cancel_flow' | 'start_flow' | 'send_message' | 'send_flow_invitation',
                        ...(newCommand.action || {})
                      }
                    });
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">No special action</option>
                <option value="cancel_flow">Cancel Current Flow</option>
                <option value="start_flow">Start Flow</option>
                <option value="send_message">Send Message</option>
                <option value="send_flow_invitation">Send Flow Invitation</option>
              </select>

              {newCommand.action && (
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  {['start_flow', 'send_flow_invitation'].includes(newCommand.action.type) && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Flow ID
                      </label>
                      <input
                        type="number"
                        value={newCommand.action.flowId || ''}
                        onChange={(e) => {
                          const flowId = e.target.value ? parseInt(e.target.value) : undefined;
                          setNewCommand({
                            ...newCommand,
                            action: { ...newCommand.action!, flowId }
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter Flow ID"
                      />
                    </div>
                  )}

                  {['send_message', 'cancel_flow', 'send_flow_invitation'].includes(newCommand.action.type) && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom Message
                      </label>
                      <textarea
                        value={newCommand.action.message || ''}
                        onChange={(e) => {
                          setNewCommand({
                            ...newCommand,
                            action: { ...newCommand.action!, message: e.target.value }
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                        rows={2}
                        placeholder="Enter custom message to send"
                      />
                    </div>
                  )}

                  {['send_message', 'send_flow_invitation'].includes(newCommand.action.type) && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Parse Mode
                      </label>
                      <select
                        value={newCommand.action.parse_mode || ''}
                        onChange={(e) => {
                          setNewCommand({
                            ...newCommand,
                            action: { ...newCommand.action!, parse_mode: e.target.value || undefined }
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">None</option>
                        <option value="HTML">HTML</option>
                        <option value="Markdown">Markdown</option>
                        <option value="MarkdownV2">MarkdownV2</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {newCommand.type === 'slash' ? 'Command (without /)' : 'Command Pattern'}
            </label>
            <input
              type="text"
              value={newCommand.name}
              onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Response
            </label>
            <textarea
              value={newCommand.response}
              onChange={(e) => setNewCommand({ ...newCommand, response: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Add Command
          </button>
        </form>
      </div>

      {/* Commands table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Command</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Response</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {commands.map((command) => (
              <tr key={command.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {command.type}
                  {command.type === 'text' && getMatchType(command) && ` (${getMatchType(command)})`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {command.type === 'slash' ? `/${command.name}` : command.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {command.action ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-500">⚙️</span>
                      <span className="italic">[Special Action]</span>
                    </div>
                  ) : (
                    command.response
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {command.priority || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {command.action ? (
                    <div className="text-xs">
                      <span className="font-medium">{command.action.type.replace('_', ' ')}</span>
                      {command.action.flowId && (
                        <div>Flow ID: {command.action.flowId}</div>
                      )}
                      {command.action.message && (
                        <div className="truncate max-w-xs" title={command.action.message}>
                          Msg: {command.action.message.substring(0, 20)}
                          {command.action.message.length > 20 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleStatus(command.id, command.is_active)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      command.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {command.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => handleDeleteCommand(command.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 