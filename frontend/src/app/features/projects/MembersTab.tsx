import React, { useState } from 'react';
import { projectApi } from './projectApi';
import { ProjectDetailResponse } from '../../types/project';
import { UserPlus, Trash2, Crown, Mail, Calendar } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ToastMessage } from '../../../shared/components/Toast';

interface MembersTabProps {
  project: ProjectDetailResponse;
  canManage: boolean;
  onRefresh: () => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  project,
  canManage,
  onRefresh,
  onAddToast,
}) => {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Removing member state
  const [removingMember, setRemovingMember] = useState<{ id: number; name: string; userId: number } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      setIsAdding(true);
      await projectApi.addMember(project.id, { email: newMemberEmail.trim() });
      onAddToast({ type: 'success', message: `Added member ${newMemberEmail}` });
      setNewMemberEmail('');
      onRefresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to add member' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingMember) return;
    try {
      setIsRemoving(true);
      await projectApi.removeMember(project.id, removingMember.userId);
      onAddToast({ type: 'success', message: `Removed member ${removingMember.name}` });
      setRemovingMember(null);
      onRefresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to remove member' });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add member form (OWNER or ADMIN only) */}
      {canManage && (
        <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <span>Add Team Member</span>
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Invite a registered user to collaborate on this project using their account email address.
          </p>

          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newMemberEmail.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2 shadow-sm"
            >
              {isAdding && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Add Member</span>
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">
            Project Members ({project.members.length})
          </h4>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {project.members.map((member) => {
            const isProjectOwner = member.user.id === project.owner.id;

            return (
              <div
                key={member.id}
                className="p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-sm">
                    {member.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{member.user.fullName}</span>
                      {isProjectOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          <Crown className="w-3 h-3" /> Project Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                      <span>{member.user.email}</span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button (can't remove owner) */}
                {canManage && !isProjectOwner && (
                  <button
                    onClick={() =>
                      setRemovingMember({
                        id: member.id,
                        name: member.user.fullName,
                        userId: member.user.id,
                      })
                    }
                    title="Remove member"
                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!removingMember}
        title="Remove Member"
        message={`Are you sure you want to remove "${removingMember?.name}" from this project? They will lose access to all project documents.`}
        confirmText="Remove Member"
        isLoading={isRemoving}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemovingMember(null)}
      />
    </div>
  );
};
