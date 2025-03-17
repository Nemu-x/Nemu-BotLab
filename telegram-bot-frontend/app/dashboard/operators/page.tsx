'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { api } from '@/src/config/api';

type Operator = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastActive?: string;
  createdAt?: string;
};

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getUsers();
      const formattedOperators = response.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role?.name || 'operator',
        isActive: user.is_active,
        lastActive: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined
      }));
      setOperators(formattedOperators);
    } catch (err: any) {
      setError(`Failed to load operators: ${err.message}`);
      console.error('Error fetching operators:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddOperator = () => {
    setIsEditing(true);
    setEditingOperator({
      id: 0, // будет заменено на реальный ID после создания
      username: '',
      email: '',
      role: 'operator',
      isActive: true,
    });
  };

  const handleEditOperator = (operator: Operator) => {
    setIsEditing(true);
    setEditingOperator(operator);
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;

    try {
      setError(null);
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      
      if (editingOperator.id === 0) {
        // Create new operator
        await api.createUser({
          username: editingOperator.username,
          email: editingOperator.email,
          role: editingOperator.role,
          password: passwordInput ? passwordInput.value : 'defaultPassword123',
          isActive: editingOperator.isActive
        });
        setSuccess('Operator created successfully');
      } else {
        // Update existing operator
        await api.updateUser(editingOperator.id.toString(), {
          username: editingOperator.username,
          email: editingOperator.email,
          role: editingOperator.role,
          isActive: editingOperator.isActive
        });
        setSuccess('Operator updated successfully');
      }

      // Refresh the operators list
      fetchUsers();
      setIsEditing(false);
      setEditingOperator(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to save operator: ${err.message}`);
      console.error('Error saving operator:', err);
    }
  };

  const handleDeleteOperator = async (id: number) => {
    if (!confirm('Are you sure you want to delete this operator?')) return;
    
    try {
      setError(null);
      await api.deleteUser(id.toString());
      setSuccess('Operator deleted successfully');
      
      // Refresh the operators list
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete operator: ${err.message}`);
      console.error('Error deleting operator:', err);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operators</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage operators and their access rights
          </p>
        </div>
        <button
          onClick={handleAddOperator}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add operator
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          {success}
        </div>
      )}

      {isEditing && editingOperator && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">
            {editingOperator.id === 0 ? 'New operator' : 'Edit operator'}
          </h2>
          <form onSubmit={handleSaveOperator} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editingOperator.username}
                  onChange={e => setEditingOperator({ ...editingOperator, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editingOperator.email}
                  onChange={e => setEditingOperator({ ...editingOperator, email: e.target.value })}
                  required
                />
              </div>

              {editingOperator.id === 0 && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue="defaultPassword123"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    User will be able to change password after first login
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  id="role"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editingOperator.role}
                  onChange={e => setEditingOperator({ ...editingOperator, role: e.target.value })}
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={editingOperator.isActive}
                onChange={e => setEditingOperator({ ...editingOperator, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingOperator(null);
                }}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Username
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {isLoading ? (
              // Loading state
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="h-4 w-16 ml-auto animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                </tr>
              ))
            ) : operators.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No operators found
                </td>
              </tr>
            ) : (
              operators.map((operator) => (
                <tr key={operator.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {operator.username}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {operator.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      operator.role === 'super_admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : operator.role === 'admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {operator.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      operator.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {operator.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditOperator(operator)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOperator(operator.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      disabled={operator.role === 'super_admin'}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 