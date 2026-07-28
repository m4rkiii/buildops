import React, { useState, useEffect } from 'react';
import { getProjects, deleteProject } from '../../services/api';
import ProjectModal from './ProjectModal';
import { Building2, Plus, MapPin, Calendar, ShieldCheck, Edit3, Trash2, ChevronRight, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function ProjectList({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateNew = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await deleteProject(projectId);
        fetchProjects();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(val);
  };

  const renderRiskBadge = (riskData) => {
    if (!riskData) {
      return (
        <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          N/A
        </span>
      );
    }

    const probPct = (riskData.delay_risk_score * 100).toFixed(1);
    const level = riskData.risk_level || 'LOW';

    switch (level) {
      case 'HIGH':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertOctagon className="w-3 h-3 mr-1" />
            HIGH ({probPct}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            MEDIUM ({probPct}%)
          </span>
        );
      default:
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            LOW ({probPct}%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>Active Construction Projects</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time project tracking, predictive risk scores, and milestone progression
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Failed to load projects: {error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-slate-500">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Fetching construction projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Projects Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first project to start tracking milestone completion, cost forecasts, and predictive risk indicators.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg inline-flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.project_id}
              onClick={() => onSelectProject(proj)}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-xl p-5 transition flex flex-col justify-between cursor-pointer group shadow-lg"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {proj.project_type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleEdit(proj, e)}
                      title="Edit Project"
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(proj.project_id, proj.project_name, e)}
                      title="Delete Project"
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition leading-snug">
                  {proj.project_name}
                </h3>

                {/* Location & Grade */}
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{proj.county} County</span>
                  </span>
                  {proj.nca_contractor_grade && (
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{proj.nca_contractor_grade}</span>
                    </span>
                  )}
                </div>

                {/* Budget */}
                <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Budget</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatCurrency(proj.budget_ksh)}
                  </span>
                </div>

                {/* Dates */}
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {proj.planned_start_date} &rarr; {proj.planned_end_date}
                  </span>
                </div>

                {/* Real Live ML Delay Risk Badge */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">AI Delay Risk</span>
                  {renderRiskBadge(proj.risk_score)}
                </div>
              </div>

              {/* View Details Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-medium text-sky-400 group-hover:text-sky-300">
                <span>View Details & Milestones</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchProjects}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
