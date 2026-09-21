import React, { useState, useEffect } from 'react';
import { getProjects, deleteProject } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectModal from './ProjectModal';
import { Building2, Plus, MapPin, Calendar, ShieldCheck, Edit3, Trash2, ChevronRight, AlertTriangle, CheckCircle2, AlertOctagon, ShieldAlert, Search, Crown } from 'lucide-react';

export default function ProjectList({ onSelectProject }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const isNcaRegulator = user && user.role === 'nca_regulator';

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
    if (isNcaRegulator) return;
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation();
    if (isNcaRegulator) return;
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (isNcaRegulator) return;
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
        <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
          N/A
        </span>
      );
    }

    const probPct = (riskData.delay_risk_score * 100).toFixed(1);
    const level = riskData.risk_level || 'LOW';

    switch (level) {
      case 'HIGH':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-black border border-white">
            <AlertOctagon className="w-3 h-3 mr-1 text-black" />
            HIGH ({probPct}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-white border border-zinc-600">
            <AlertTriangle className="w-3 h-3 mr-1 text-white" />
            MEDIUM ({probPct}%)
          </span>
        );
      default:
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-700">
            <CheckCircle2 className="w-3 h-3 mr-1 text-zinc-300" />
            LOW ({probPct}%)
          </span>
        );
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.project_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || p.nca_contractor_grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* NCA Regulator Read-Only Portal Banner */}
      {isNcaRegulator && (
        <div data-testid="nca-portal-banner" className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 flex items-center justify-between text-xs text-white">
          <div className="flex items-center space-x-3.5">
            <ShieldAlert className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="font-bold text-sm text-white">National Construction Authority (NCA) Regulatory Audit Portal</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                You possess nationwide compliance inspection privileges. All project mutations and deletions are restricted.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-black font-bold text-[10px] uppercase tracking-wider shrink-0 border border-zinc-300">
            NCA Authorized Inspector
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-aserre rounded-2xl p-6 shadow-xl border border-zinc-800 bg-zinc-950">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Crown className="w-6 h-6 text-white" />
            <span>{isNcaRegulator ? 'Nationwide Construction Audit Registry' : 'Active Construction Portfolio'}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Real-time project tracking, predictive risk scores, and milestone progression
          </p>
        </div>

        {!isNcaRegulator && (
          <button
            onClick={handleCreateNew}
            className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition self-start sm:self-auto border border-zinc-300"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Compliance Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search projects by name, county, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider whitespace-nowrap">NCA Grade:</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Grades</option>
            <option value="NCA 1">NCA 1</option>
            <option value="NCA 2">NCA 2</option>
            <option value="NCA 3">NCA 3</option>
            <option value="NCA 4">NCA 4</option>
            <option value="NCA 5">NCA 5</option>
            <option value="NCA 6">NCA 6</option>
            <option value="NCA 7">NCA 7</option>
            <option value="NCA 8">NCA 8</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-zinc-900 border border-white text-white p-4 rounded-2xl text-xs flex items-center space-x-2 font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
          <span>Failed to load projects: {error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 flex justify-center items-center text-zinc-400">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Fetching construction projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center mx-auto border border-zinc-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">No Matching Projects Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
              {isNcaRegulator ? 'No projects match your current compliance filter criteria.' : 'Create your first project to start tracking milestone completion and predictive risk indicators.'}
            </p>
          </div>
          {!isNcaRegulator && (
            <button
              onClick={handleCreateNew}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center space-x-1.5 transition border border-zinc-300"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Add First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.project_id}
              onClick={() => onSelectProject(proj)}
              className="card-aserre rounded-2xl p-6 transition flex flex-col justify-between cursor-pointer group shadow-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-500"
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-700 uppercase tracking-wider">
                    {proj.project_type}
                  </span>
                  {!isNcaRegulator && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleEdit(proj, e)}
                        title="Edit Project"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(proj.project_id, proj.project_name, e)}
                        title="Delete Project"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-zinc-300 transition leading-snug tracking-tight">
                  {proj.project_name}
                </h3>

                {/* Location & Grade */}
                <div className="flex items-center space-x-3 text-xs text-zinc-400 font-medium">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span>{proj.county} County</span>
                  </span>
                  {proj.nca_contractor_grade && (
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span>{proj.nca_contractor_grade}</span>
                    </span>
                  )}
                </div>

                {/* Budget */}
                <div className="bg-black rounded-xl p-3 border border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Budget</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(proj.budget_ksh)}
                  </span>
                </div>

                {/* Dates */}
                <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    {proj.planned_start_date} &rarr; {proj.planned_end_date}
                  </span>
                </div>

                {/* Real Live ML Risk & Cost Overrun Badges */}
                <div className="bg-black border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] font-medium">AI Delay Risk</span>
                    {renderRiskBadge(proj.risk_score)}
                  </div>
                  {proj.risk_score && proj.risk_score.cost_overrun_pct !== undefined && (
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
                      <span className="text-zinc-400 text-[11px] font-medium">Est. Cost Overrun</span>
                      <span data-testid="cost-overrun-badge" className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        proj.risk_score.cost_overrun_pct > 10.0
                          ? 'bg-white text-black border border-white'
                          : proj.risk_score.cost_overrun_pct > 3.0
                          ? 'bg-zinc-800 text-white border border-zinc-600'
                          : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                      }`}>
                        +{proj.risk_score.cost_overrun_pct}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Action */}
              <div className="mt-5 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-white group-hover:text-zinc-300 transition">
                <span>{isNcaRegulator ? 'Audit Milestones & Compliance' : 'View Details & Milestones'}</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {!isNcaRegulator && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchProjects}
          projectToEdit={projectToEdit}
        />
      )}
    </div>
  );
}
