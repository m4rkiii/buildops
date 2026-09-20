import React from 'react';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SCurveChart({ project }) {
  if (!project) return null;

  const budget = parseFloat(project.budget_ksh || 450000000);
  const costOverrunPct = project.risk_score ? project.risk_score.cost_overrun_pct : 4.2;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Generate 6 Quarterly S-Curve Data Points (Planned vs Actual vs AI Forecast)
  const timelinePoints = [
    { period: 'Q1 2026', planned: budget * 0.10, actual: budget * 0.09, forecast: budget * 0.10 },
    { period: 'Q2 2026', planned: budget * 0.30, actual: budget * 0.28, forecast: budget * 0.31 },
    { period: 'Q3 2026', planned: budget * 0.55, actual: budget * 0.51, forecast: budget * 0.58 },
    { period: 'Q4 2026', planned: budget * 0.75, actual: null, forecast: budget * 0.81 },
    { period: 'Q1 2027', planned: budget * 0.90, actual: null, forecast: budget * 0.97 },
    { period: 'Q2 2027', planned: budget * 1.00, actual: null, forecast: budget * (1 + costOverrunPct / 100) },
  ];

  return (
    <div className="card-aserre rounded-2xl p-6 shadow-2xl space-y-5 border border-[#D7B66D]/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D7B66D]/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl border border-purple-500/30 shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif-luxury text-white tracking-tight">
              Financial Cash Flow S-Curve & Burn Trajectory
            </h3>
            <p className="text-xs text-[#8FA399]">
              Planned Cumulative Spend vs Actual Milestone Expenses vs AI Forecasted Trajectory
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D7B66D]"></span>
            <span className="text-[#8FA399]">Planned Baseline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="text-[#8FA399]">Actual Spend</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-400"></span>
            <span className="text-[#8FA399]">AI Forecast</span>
          </div>
        </div>
      </div>

      {/* S-Curve Quarterly Breakdown Bars */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {timelinePoints.map((pt, idx) => {
            const plannedHeight = (pt.planned / (budget * 1.15)) * 100;
            const actualHeight = pt.actual ? (pt.actual / (budget * 1.15)) * 100 : 0;
            const forecastHeight = (pt.forecast / (budget * 1.15)) * 100;

            return (
              <div key={idx} className="bg-[#0B2318] p-3 rounded-xl border border-[#D7B66D]/15 flex flex-col justify-between space-y-3">
                <div className="text-center border-b border-[#D7B66D]/10 pb-1">
                  <span className="text-xs font-bold text-white font-serif-luxury">{pt.period}</span>
                </div>

                {/* Vertical Visual Bars */}
                <div className="h-28 flex items-end justify-center space-x-1.5 pt-2 px-1">
                  {/* Planned Bar */}
                  <div
                    style={{ height: `${plannedHeight}%` }}
                    className="w-2.5 bg-[#D7B66D]/70 rounded-t transition-all"
                    title={`Planned: ${formatCurrency(pt.planned)}`}
                  ></div>

                  {/* Actual Bar (if available) */}
                  {pt.actual !== null && (
                    <div
                      style={{ height: `${actualHeight}%` }}
                      className="w-2.5 bg-emerald-400 rounded-t transition-all"
                      title={`Actual: ${formatCurrency(pt.actual)}`}
                    ></div>
                  )}

                  {/* AI Forecast Bar */}
                  <div
                    style={{ height: `${forecastHeight}%` }}
                    className="w-2.5 bg-purple-400/80 rounded-t transition-all"
                    title={`Forecast: ${formatCurrency(pt.forecast)}`}
                  ></div>
                </div>

                <div className="text-[10px] text-center text-[#8FA399] font-mono pt-1">
                  {formatCurrency(pt.forecast)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
