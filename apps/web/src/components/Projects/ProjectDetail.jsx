import React, { useState } from 'react';
import MilestoneList from '../Milestones/MilestoneList';
import AIDigestModal from '../Reports/AIDigestModal';
import ScheduleForecastCard from './ScheduleForecastCard';
import AnomalyBadge from './AnomalyBadge';
import ScenarioSimulatorCard from './ScenarioSimulatorCard';
import SCurveChart from './SCurveChart';
import ExecutivePdfExporter from '../Reports/ExecutivePdfExporter';
import { ArrowLeft, MapPin, DollarSign, Calendar, AlertCircle, CheckCircle2, TrendingUp, AlertOctagon, AlertTriangle, Cpu, Crown } from 'lucide-react';

export default function ProjectDetail({ project, onBack, token }) {
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const authToken = token || localStorage.getItem('token');

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
            <span className="text-xl font-bold text-white">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-white bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700 font-semibold flex items-center">
              <AlertOctagon className="w-3 h-3 mr-1" /> HIGH
            </span>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-bold text-white">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-semibold flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> MEDIUM
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-bold text-white">{riskProbPct}%</span>
            <span data-testid="risk-score-badge" className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-semibold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> LOW
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 px-4 py-2 rounded-xl shadow-md w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
          <span>Back to Project Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <ExecutivePdfExporter project={project} />

          <button
            onClick={() => setIsDigestOpen(true)}
            data-testid="generate-digest-btn"
            className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-md"
          >
            <Cpu className="w-4 h-4" />
            <span>Generate AI Executive Digest</span>
          </button>
        </div>
      </div>

      {/* Anomaly Warning Banner (If metrics contain outliers) */}
      <AnomalyBadge projectId={project.project_id} token={authToken} />

      {/* Hero Header Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-7 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 uppercase tracking-wider">
                {project.project_type}
              </span>
              {project.nca_contractor_grade && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {project.nca_contractor_grade}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{project.project_name}</h1>
            <p className="text-xs text-zinc-400 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{project.county} County, Kenya</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white border border-zinc-700">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Project Active
            </span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Total Budget */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
              <span>Total Project Budget</span>
            </span>
            <div className="text-xl font-bold text-white">{formatCurrency(project.budget_ksh)}</div>
          </div>

          {/* Timeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Planned Duration</span>
            </span>
            <div className="text-xs font-semibold text-white mt-1">
              {project.planned_start_date} &rarr; {project.planned_end_date}
            </div>
          </div>

          {/* AI Delay Risk Score (Ensemble ML inference) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>AI Ensemble Risk</span>
            </span>
            {renderRiskMetric()}
          </div>

          {/* Cost Overrun Forecast (Real Live ML inference) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cost Overrun Forecast</span>
            </span>
            {risk && risk.cost_overrun_pct !== undefined ? (
              <div>
                <div data-testid="cost-overrun-badge" className="text-xl font-bold text-white">
                  +{risk.cost_overrun_pct}% Est.
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Est. {formatCurrency(risk.estimated_overrun_ksh || (project.budget_ksh * (risk.cost_overrun_pct / 100)))} overrun
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold text-zinc-500">N/A</div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive What-If Scenario Simulator & AI Copilot */}
      <ScenarioSimulatorCard project={project} token={authToken} />

      {/* Financial Cash Flow S-Curve & Burn Trajectory Chart */}
      <SCurveChart project={project} />

      {/* Schedule Forecast Card (ML) */}
      <ScheduleForecastCard projectId={project.project_id} token={authToken} />

      {/* Milestone Timeline Component */}
      <MilestoneList projectId={project.project_id} />

      {/* AI Executive Digest Modal */}
      <AIDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        projectId={project.project_id}
        projectName={project.project_name}
      />
    </div>
  );
}
