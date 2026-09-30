import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/features/auth/AuthContext';
import { LoginScreen } from './app/features/auth/LoginScreen';
import { RegisterScreen } from './app/features/auth/RegisterScreen';
import { ProjectsDashboard } from './app/features/projects/ProjectsDashboard';
import { ProjectDetail } from './app/features/projects/ProjectDetail';
import { ProfileTab } from './app/features/profile/ProfileTab';
import { AdminPanel } from './app/features/admin/AdminPanel';
import { Layout } from './shared/components/Layout';
import { ToastMessage } from './shared/components/Toast';
import { AnimatedBackground } from './shared/components/AnimatedBackground';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AuthProvider>
      <AnimatedBackground />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginScreen />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterScreen />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes inside Layout */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout toasts={toasts} onDismissToast={dismissToast}>
                  <ProjectsDashboard onAddToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Layout toasts={toasts} onDismissToast={dismissToast}>
                  <ProjectDetail onAddToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout toasts={toasts} onDismissToast={dismissToast}>
                  <ProfileTab onAddToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout toasts={toasts} onDismissToast={dismissToast}>
                  <AdminPanel onAddToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
