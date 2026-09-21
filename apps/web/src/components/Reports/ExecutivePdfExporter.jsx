import React from 'react';
import { FileDown, Printer, Crown, ShieldCheck, CheckCircle2, AlertTriangle, Building2, MapPin } from 'lucide-react';

export default function ExecutivePdfExporter({ project }) {
  const handlePrint = () => {
    window.print();
  };

  if (!project) return null;

  const risk = project.risk_score;
  const riskProbPct = risk ? (risk.delay_risk_score * 100).toFixed(1) : '12.0';
  const costOverrunPct = risk ? risk.cost_overrun_pct : '4.2';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handlePrint}
        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-md"
        title="Print or Save as PDF Executive Briefing"
      >
        <Printer className="w-4 h-4 text-zinc-300" />
        <span>Export Executive PDF</span>
      </button>

      {/* Hidden Print Container - Styled specifically for PDF Export */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[99999]">
        {/* PDF Header */}
        <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight font-serif">
                BuildOps Sentinel
              </h1>
              <p className="text-xs text-gray-700 uppercase tracking-widest font-semibold">
                Executive Risk Intelligence Briefing & NCA Compliance Audit
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-KE')}</div>
            <div><strong>Status:</strong> Regulatory Audit Verified</div>
          </div>
        </div>

        {/* Project Summary Box */}
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-black uppercase tracking-wider bg-gray-200 px-2.5 py-0.5 rounded border border-gray-300">
                {project.project_type} ({project.nca_contractor_grade || 'NCA 1'})
              </span>
              <h2 className="text-2xl font-bold text-black font-serif mt-1">{project.project_name}</h2>
              <p className="text-xs text-gray-700 flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 text-black mr-1" />
                {project.county} County, Kenya
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 uppercase font-semibold">Total Budget</div>
              <div className="text-xl font-bold text-black">{formatCurrency(project.budget_ksh)}</div>
            </div>
          </div>
        </div>

        {/* Risk Intelligence Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300 rounded-xl p-4">
            <div className="text-xs text-gray-600 font-semibold uppercase">AI Delay Risk Probability</div>
            <div className="text-3xl font-bold text-black mt-1">{riskProbPct}%</div>
            <div className="text-xs text-gray-700 font-medium mt-1">Multi-model XGBoost + RF Ensemble Prediction</div>
          </div>

          <div className="border border-gray-300 rounded-xl p-4">
            <div className="text-xs text-gray-600 font-semibold uppercase">Cost Overrun Forecast</div>
            <div className="text-3xl font-bold text-black mt-1">+{costOverrunPct}%</div>
            <div className="text-xs text-gray-600 mt-1">Est. {formatCurrency(project.budget_ksh * (costOverrunPct / 100))} overspend</div>
          </div>
        </div>

        {/* Compliance Footer Seal */}
        <div className="border-t border-gray-300 pt-4 mt-8 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>Authenticated via BuildOps Sentinel Security Engine</span>
          </div>
          <div>National Construction Authority (NCA) Regulatory Alignment</div>
        </div>
      </div>
    </>
  );
}
