import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Copy,
  Clock,
  Layers,
  Cpu,
  Circle,
  GitFork,
  CheckSquare,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Modal, EmptyState } from '@/components/ui';
import { recentProjects as initialProjects } from '@/data/mock';
import { formatDate, projectTypeLabel, cn } from '@/utils';
import type { Project, ProjectType } from '@/types';

const typeIcons: Record<string, React.ElementType> = {
  dfa: Circle,
  nfa: GitFork,
  pda: Layers,
  tm: Cpu,
  re: CheckSquare,
  cfg: FileCode,
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  dfa: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  nfa: { bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  pda: { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  tm:  { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  re:  { bg: 'bg-pink-50 dark:bg-pink-950', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  cfg: { bg: 'bg-cyan-50 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
};

function createNewProject(title: string, desc: string, type: ProjectType): Project {
  const timestamp = new Date().toISOString();
  return {
    id: `proj-${Date.now()}`,
    name: title.trim(),
    description: desc.trim() || `New ${projectTypeLabel[type]} project`,
    type: type,
    unitId: type === 'dfa' || type === 'nfa' ? 'finite-automata' : 'pushdown-automata',
    createdAt: timestamp,
    updatedAt: timestamp,
    stateCount: type === 're' ? undefined : 2,
    transitionCount: type === 're' ? undefined : 2,
  };
}

function createDuplicateProject(project: Project): Project {
  const timestamp = new Date().toISOString();
  return {
    ...project,
    id: `proj-${Date.now()}`,
    name: `${project.name} (Copy)`,
    updatedAt: timestamp,
    createdAt: timestamp,
  };
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New project form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProjectType>('dfa');
  const [newDesc, setNewDesc] = useState('');

  const filteredProjects = projects.filter((p) => {
    if (selectedType !== 'all' && p.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProject = createNewProject(newTitle, newDesc, newType);
    setProjects([newProject, ...projects]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    navigate('/playground');
  };

  const handleDuplicate = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated = createDuplicateProject(project);
    setProjects([duplicated, ...projects]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Projects"
        description="Saved automata designs, grammars, and regular expressions stored locally in your browser workspace."
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Project
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search saved projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium self-center">
            {filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
            Model:
          </span>
          {[
            { id: 'all', label: 'All Models' },
            { id: 'dfa', label: 'DFA' },
            { id: 'nfa', label: 'NFA' },
            { id: 'pda', label: 'PDA' },
            { id: 'tm', label: 'Turing Machine' },
            { id: 're', label: 'Regex' },
          ].map(({ id, label }) => {
            const isSelected = selectedType === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  isSelected
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
          <EmptyState
            icon={<FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            title="No projects found"
            description="You don't have any projects matching your current filter. Create a new model to start experimenting."
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create First Automaton
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const Icon = typeIcons[project.type] ?? Circle;
            const style = typeColors[project.type] ?? typeColors.dfa;

            return (
              <div
                key={project.id}
                onClick={() => navigate('/playground')}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border',
                        style.bg,
                        style.text,
                        style.border
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {projectTypeLabel[project.type]}
                    </span>

                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">
                    {project.description}
                  </p>
                </div>

                {/* Card bottom */}
                <div>
                  {/* Model stats if applicable */}
                  {(project.stateCount !== undefined || project.transitionCount !== undefined) && (
                    <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 py-2 border-t border-gray-50 dark:border-gray-800 mb-3">
                      {project.stateCount !== undefined && (
                        <span>
                          <strong className="text-gray-700 dark:text-gray-300">{project.stateCount}</strong> states
                        </span>
                      )}
                      {project.transitionCount !== undefined && (
                        <span>
                          <strong className="text-gray-700 dark:text-gray-300">{project.transitionCount}</strong> transitions
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open in Playground <ArrowRight className="w-3 h-3" />
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(project, e)}
                        title="Duplicate project"
                        aria-label="Duplicate project"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(project.id);
                        }}
                        title="Delete project"
                        aria-label="Delete project"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          isOpen={Boolean(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Project"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Are you sure you want to delete this project? This action removes the saved design from your local workspace.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={(e) => handleDelete(deleteConfirmId, e)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Automaton Project"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Divisible by 3 DFA"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Model Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'dfa', label: 'DFA' },
                { type: 'nfa', label: 'NFA' },
                { type: 'pda', label: 'PDA' },
                { type: 'tm', label: 'TM' },
                { type: 're', label: 'Regex' },
                { type: 'cfg', label: 'CFG' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type as ProjectType)}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all',
                    newType === type
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-500'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the formal language or purpose..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create & Launch Playground
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
