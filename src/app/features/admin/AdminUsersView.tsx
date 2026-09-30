import React, { useState } from 'react';
import { UserResponse, Role, AdminUpdateUserRequest } from '../../types/user';
import { Edit2, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface AdminUsersViewProps {
  users: UserResponse[];
  currentUserId?: number;
  onUpdateUser: (id: number, data: AdminUpdateUserRequest) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  currentUserId,
  onUpdateUser,
  onDeleteUser,
}) => {
  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEdit = (user: UserResponse) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setRole(user.role);
    setActive(user.active);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setIsSaving(true);
      await onUpdateUser(editingUser.id, {
        fullName: fullName.trim(),
        role,
        active,
      });
      setEditingUser(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      setIsDeleting(true);
      await onDeleteUser(deletingUser.id);
      setDeletingUser(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (userRole: Role) => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
            <Shield className="w-3 h-3" /> ADMIN
          </span>
        );
      case 'OWNER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            OWNER
          </span>
        );
      case 'USER':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium">
            USER
          </span>
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;

              return (
                <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-xs shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-sm">You</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                  <td className="py-3.5 px-4">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Deactivated
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          title="Delete User"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-white">Edit User: {editingUser.email}</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-hidden focus:border-blue-500 transition-colors"
                >
                  <option value="USER">USER</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="userActive" className="text-sm font-medium text-zinc-200 cursor-pointer">
                  Account Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${deletingUser?.fullName}" (${deletingUser?.email})? This action cannot be undone.`}
        confirmText="Delete User"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingUser(null)}
      />
    </>
  );
};
