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
        <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0B2318] text-[#8FA399] border border-[#D7B66D]/20">
          N/A
        </span>
      );
    }

    const probPct = (riskData.delay_risk_score * 100).toFixed(1);
    const level = riskData.risk_level || 'LOW';

    switch (level) {
      case 'HIGH':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-3 h-3 mr-1" />
            HIGH ({probPct}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#D7B66D]/15 text-[#D7B66D] border border-[#D7B66D]/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            MEDIUM ({probPct}%)
          </span>
        );
      default:
        return (
          <span data-testid="risk-score-badge" className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
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
        <div data-testid="nca-portal-banner" className="bg-[#D7B66D]/15 border border-[#D7B66D]/30 rounded-2xl p-4 flex items-center justify-between text-xs text-[#D7B66D]">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#D7B66D] shrink-0" />
            <div>
              <span className="font-bold font-serif-luxury text-sm text-white">National Construction Authority (NCA) Regulatory Audit Portal</span>
              <p className="text-[11px] text-[#8FA399] mt-0.5">
                You possess nationwide compliance inspection privileges. All project mutations and deletions are restricted.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#D7B66D]/20 text-[#D7B66D] font-bold text-[10px] uppercase tracking-wider shrink-0 border border-[#D7B66D]/30">
            NCA Authorized Inspector
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-aserre rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-white tracking-tight flex items-center space-x-2.5">
            <Crown className="w-6 h-6 text-[#D7B66D]" />
            <span>{isNcaRegulator ? 'Nationwide Construction Audit Registry' : 'Active Construction Portfolio'}</span>
          </h2>
          <p className="text-xs text-[#8FA399] mt-1">
            Real-time project tracking, predictive risk scores, and milestone progression
          </p>
        </div>

        {!isNcaRegulator && (
          <button
            onClick={handleCreateNew}
            className="btn-aserre-gold text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Compliance Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#102A25] p-3.5 rounded-2xl border border-[#D7B66D]/20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8FA399] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search projects by name, county, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8FA399]/60 focus:outline-none focus:border-[#D7B66D]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-[#8FA399] uppercase font-semibold tracking-wider whitespace-nowrap">NCA Grade:</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-[#0B2318] border border-[#D7B66D]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D7B66D]"
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
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Failed to load projects: {error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 flex justify-center items-center text-[#8FA399]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#D7B66D] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Fetching construction projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#102A25] border border-dashed border-[#D7B66D]/30 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-[#D7B66D]/10 text-[#D7B66D] rounded-full flex items-center justify-center mx-auto border border-[#D7B66D]/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif-luxury text-white">No Matching Projects Found</h3>
            <p className="text-xs text-[#8FA399] max-w-sm mx-auto">
              {isNcaRegulator ? 'No projects match your current compliance filter criteria.' : 'Create your first project to start tracking milestone completion and predictive risk indicators.'}
            </p>
          </div>
          {!isNcaRegulator && (
            <button
              onClick={handleCreateNew}
              className="btn-aserre-gold text-xs font-semibold px-4 py-2.5 rounded-xl inline-flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
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
              className="card-aserre rounded-2xl p-6 transition flex flex-col justify-between cursor-pointer group shadow-xl"
            >
              <div className="space-y-3.5">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md badge-aserre-gold uppercase tracking-wider">
                    {proj.project_type}
                  </span>
                  {!isNcaRegulator && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleEdit(proj, e)}
                        title="Edit Project"
                        className="p-1.5 text-[#8FA399] hover:text-[#D7B66D] hover:bg-[#0B2318] rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(proj.project_id, proj.project_name, e)}
                        title="Delete Project"
                        className="p-1.5 text-[#8FA399] hover:text-red-400 hover:bg-[#0B2318] rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold font-serif-luxury text-white group-hover:text-[#D7B66D] transition leading-snug">
                  {proj.project_name}
                </h3>

                {/* Location & Grade */}
                <div className="flex items-center space-x-3 text-xs text-[#8FA399]">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D7B66D]" />
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
                <div className="bg-[#0B2318] rounded-xl p-3 border border-[#D7B66D]/20 flex items-center justify-between">
                  <span className="text-[11px] text-[#8FA399] uppercase font-semibold tracking-wider">Budget</span>
                  <span className="text-sm font-bold text-[#D7B66D] font-serif-luxury">
                    {formatCurrency(proj.budget_ksh)}
                  </span>
                </div>

                {/* Dates */}
                <div className="flex items-center space-x-1.5 text-[11px] text-[#8FA399]">
                  <Calendar className="w-3.5 h-3.5 text-[#D7B66D]/60" />
                  <span>
                    {proj.planned_start_date} &rarr; {proj.planned_end_date}
                  </span>
                </div>

                {/* Real Live ML Risk & Cost Overrun Badges */}
                <div className="bg-[#0B2318] border border-[#D7B66D]/20 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FA399] text-[11px]">AI Delay Risk</span>
                    {renderRiskBadge(proj.risk_score)}
                  </div>
                  {proj.risk_score && proj.risk_score.cost_overrun_pct !== undefined && (
                    <div className="flex items-center justify-between border-t border-[#D7B66D]/15 pt-2">
                      <span className="text-[#8FA399] text-[11px]">Est. Cost Overrun</span>
                      <span data-testid="cost-overrun-badge" className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        proj.risk_score.cost_overrun_pct > 10.0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : proj.risk_score.cost_overrun_pct > 3.0
                          ? 'bg-[#D7B66D]/15 text-[#D7B66D] border border-[#D7B66D]/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        +{proj.risk_score.cost_overrun_pct}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Action */}
              <div className="mt-5 pt-3.5 border-t border-[#D7B66D]/20 flex items-center justify-between text-xs font-semibold text-[#D7B66D] group-hover:text-white transition">
                <span>{isNcaRegulator ? 'Audit Milestones & Compliance' : 'View Details & Milestones'}</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
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
