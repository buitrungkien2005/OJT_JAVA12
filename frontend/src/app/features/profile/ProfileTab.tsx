import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/userApi';
import { useAuth } from '../auth/AuthContext';
import { User, Lock, Mail, Shield, Calendar, CheckCircle2 } from 'lucide-react';
import { ToastMessage } from '../../../shared/components/Toast';

interface ProfileTabProps {
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onAddToast }) => {
  const { user, refreshUser } = useAuth();

  // Profile update state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    try {
      setIsUpdatingProfile(true);
      await userApi.updateProfile({ fullName: fullName.trim() });
      await refreshUser();
      onAddToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to update profile' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    if (newPassword.length < 6) {
      onAddToast({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      onAddToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    try {
      setIsChangingPassword(true);
      await userApi.changePassword({ oldPassword, newPassword });
      onAddToast({ type: 'success', message: 'Password changed successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <User className="w-7 h-7 text-blue-500" />
          <span>My Profile</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account information and security credentials
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold text-xl flex items-center justify-center">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.fullName}</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Role: {user?.role}
              </span>
            </div>
          </div>
        </div>

        {user?.createdAt && (
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
        <h3 className="text-base font-semibold text-white">Personal Information</h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address (Read-only)
            </label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 bg-zinc-950/50 border border-zinc-800/60 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
            />
          </div>

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

          <button
            type="submit"
            disabled={isUpdatingProfile || fullName === user?.fullName}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdatingProfile && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>Save Profile Changes</span>
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-400" />
          <span>Change Password</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword || !oldPassword || !newPassword}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isChangingPassword && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>
    </div>
  );
};
