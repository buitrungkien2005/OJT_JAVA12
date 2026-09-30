import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/features/auth/AuthContext';
import { FolderGit2, Users, User, LogOut, Shield } from 'lucide-react';
import { ToastContainer, ToastMessage } from './Toast';

interface LayoutProps {
  children: React.ReactNode;
  toasts?: ToastMessage[];
  onDismissToast?: (id: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, toasts = [], onDismissToast = () => {} }) => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    ...(isAdmin ? [{ label: 'Admin Panel', path: '/admin', icon: Users }] : []),
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/projects" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
                12
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white leading-tight">OJT Java12</span>
                <span className="text-[11px] font-medium text-zinc-400">Knowledge Base</span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-zinc-200">{user?.fullName}</span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20 text-[10px]">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                ) : (
                  <span>{user?.role}</span>
                )}
                <span>• {user?.email}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex border-t border-zinc-800/80 px-2 py-1.5 bg-zinc-900/90 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
};
