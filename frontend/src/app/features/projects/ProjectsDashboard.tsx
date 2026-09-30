import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from './projectApi';
import { ProjectResponse } from '../../types/project';
import { useAuth } from '../auth/AuthContext';
import { Plus, Search, FolderGit2, Users, FileText, Calendar, Edit3, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ToastMessage } from '../../../shared/components/Toast';

interface ProjectsDashboardProps {
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ onAddToast }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const canCreateProject = user?.role === 'OWNER' || isAdmin;

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete dialog state
  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await projectApi.getAccessibleProjects();
      setProjects(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to load projects' });
    } finally {
      setIsLoading(false);
    }
  }, [onAddToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, project: ProjectResponse) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setIsSaving(true);
      if (editingProject) {
        await projectApi.updateProject(editingProject.id, {
          name: projectName,
          description: projectDescription,
        });
        onAddToast({ type: 'success', message: 'Project updated successfully' });
      } else {
        await projectApi.createProject({
          name: projectName,
          description: projectDescription,
        });
        onAddToast({ type: 'success', message: 'Project created successfully' });
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to save project' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      setIsDeleting(true);
      await projectApi.deleteProject(deletingProject.id);
      onAddToast({ type: 'success', message: 'Project deleted successfully' });
      setDeletingProject(null);
      fetchProjects();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to delete project' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.owner.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-blue-500" />
            <span>Projects</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse and manage your team knowledge repositories
          </p>
        </div>

        {canCreateProject && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, description, owner..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <FolderGit2 className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No projects found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'No projects match your current search query.'
              : 'Create your first project to start organizing team documents and media.'}
          </p>
          {!searchQuery && canCreateProject && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isOwner = user?.id === project.owner.id;
            const canManage = isOwner || isAdmin;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative flex flex-col justify-between p-6 bg-zinc-900 border border-zinc-800 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {project.name}
                    </h3>

                    {/* Actions dropdown/buttons */}
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(e, project)}
                          title="Edit Project"
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingProject(project);
                          }}
                          title="Delete Project"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5" title="Documents">
                      <FileText className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{project.documentCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5" title="Members">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{project.memberCount}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Mobile App Redesign"
                  maxLength={150}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All documents, media, and member access will be permanently deleted.`}
        confirmText="Delete Project"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
};
