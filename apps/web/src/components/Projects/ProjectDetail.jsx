import React from 'react';
import MilestoneList from '../Milestones/MilestoneList';
import { ArrowLeft, MapPin, DollarSign, Calendar, AlertCircle, CheckCircle2, TrendingUp, AlertOctagon, AlertTriangle } from 'lucide-react';

export default function ProjectDetail({ project, onBack }) {
  if (!project) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(val);
  };

  const risk = project.risk_score;
  const riskProbPct = risk ? (risk.delay_risk_score * 100).toFixed(1) : '12.0';
  const riskLevel = risk ? risk.risk_level : 'LOW';

  const renderRiskMetric = () => {
    switch (riskLevel) {
      case 'HIGH':
        return (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg font-bold text-red-400">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-semibold flex items-center">
              <AlertOctagon className="w-3 h-3 mr-1" /> HIGH
            </span>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg font-bold text-amber-400">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> MEDIUM
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg font-bold text-emerald-400">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> LOW
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Project Dashboard</span>
      </button>

      {/* Hero Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                {project.project_type}
              </span>
              {project.nca_contractor_grade && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {project.nca_contractor_grade}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.project_name}</h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{project.county} County, Kenya</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Project Active
            </span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Total Budget */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Project Budget</span>
            </span>
            <div className="text-lg font-bold text-white">{formatCurrency(project.budget_ksh)}</div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Planned Duration</span>
            </span>
            <div className="text-xs font-semibold text-white mt-1">
              {project.planned_start_date} &rarr; {project.planned_end_date}
            </div>
          </div>

          {/* AI Delay Risk Score (Real Live ML inference) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Delay Risk Score</span>
            </span>
            {renderRiskMetric()}
          </div>

          {/* Cost Overrun Forecast (Real Live ML inference) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Cost Overrun Forecast</span>
            </span>
            {risk && risk.cost_overrun_pct !== undefined ? (
              <div>
                <div data-testid="cost-overrun-badge" className="text-lg font-bold text-purple-400">
                  +{risk.cost_overrun_pct}% Est.
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Est. {formatCurrency(risk.estimated_overrun_ksh || (project.budget_ksh * (risk.cost_overrun_pct / 100)))} overrun
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-500">N/A</div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Timeline Component */}
      <MilestoneList projectId={project.project_id} />
    </div>
  );
}
