import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../services/userApi';
import { UserResponse, AdminUpdateUserRequest } from '../../types/user';
import { AdminUsersView } from './AdminUsersView';
import { Pagination } from '../../../shared/components/Pagination';
import { useAuth } from '../auth/AuthContext';
import { Users, Search, ShieldAlert } from 'lucide-react';
import { ToastMessage } from '../../../shared/components/Toast';

interface AdminPanelProps {
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onAddToast }) => {
  const { user, isAdmin } = useAuth();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getAllUsers(currentPage, 10, searchQuery);
      setUsers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, onAddToast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
          You need administrator privileges to view and manage user accounts.
        </p>
      </div>
    );
  }

  const handleUpdateUser = async (id: number, data: AdminUpdateUserRequest) => {
    try {
      await userApi.updateUserAsAdmin(id, data);
      onAddToast({ type: 'success', message: 'User updated successfully' });
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to update user' });
      throw err;
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await userApi.deleteUser(id);
      onAddToast({ type: 'success', message: 'User deleted successfully' });
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to delete user' });
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-500" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage system users, role assignments, and active accounts
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Users Card Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-zinc-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-300">No users found</h4>
            <p className="text-xs text-zinc-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No registered users available.'}
            </p>
          </div>
        ) : (
          <AdminUsersView
            users={users}
            currentUserId={user?.id}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
