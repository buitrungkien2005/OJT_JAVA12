import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from './projectApi';
import { ProjectDetailResponse } from '../../types/project';
import { DocumentsTab } from '../documents/DocumentsTab';
import { MembersTab } from './MembersTab';
import { ArrowLeft, FolderGit2, FileText, Users, Calendar, Crown } from 'lucide-react';
import { ToastMessage } from '../../../shared/components/Toast';

interface ProjectDetailProps {
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ onAddToast }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'members'>('documents');

  const projectId = Number(id);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const data = await projectApi.getProjectById(projectId);
      setProject(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to load project details' });
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onAddToast, navigate]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-zinc-900 rounded-xl animate-pulse" />
        <div className="h-44 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Back to projects link */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Header Banner */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl shrink-0 mt-0.5">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                {project.isOwner && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                    <Crown className="w-3.5 h-3.5" /> Project Owner
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Project Meta Bar */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Owner:</span>
            <strong className="text-zinc-200">{project.owner.fullName}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>{project.documentCount} document{project.documentCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Media</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({project.members.length})</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'documents' ? (
        <DocumentsTab
          projectId={project.id}
          projectOwnerId={project.owner.id}
          onAddToast={onAddToast}
        />
      ) : (
        <MembersTab
          project={project}
          canManage={project.isOwner}
          onRefresh={fetchProjectDetails}
          onAddToast={onAddToast}
        />
      )}
    </div>
  );
};
