import React, { useState, useEffect } from 'react';
import { Sliders, TrendingDown, Cpu, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function ScenarioSimulatorCard({ project, token }) {
  const [budgetAdjustment, setBudgetAdjustment] = useState(0); // in Millions KSh
  const [scheduleExtension, setScheduleExtension] = useState(0); // in Days
  const [contractorGrade, setContractorGrade] = useState(project.nca_contractor_grade || 'NCA 1');

  const baseBudget = parseFloat(project.budget_ksh || 450000000);
  const baseRisk = project.risk_score ? project.risk_score.delay_risk_score : 0.18;
  const baseCostOverrun = project.risk_score ? project.risk_score.cost_overrun_pct : 4.2;

  const [simulatedRiskProb, setSimulatedRiskProb] = useState(baseRisk);
  const [simulatedCostOverrun, setSimulatedCostOverrun] = useState(baseCostOverrun);
  const [mitigations, setMitigations] = useState([]);

  useEffect(() => {
    // Recalculate dynamic risk based on interactive slider adjustments
    let newRisk = baseRisk;
    let newCostOverrun = baseCostOverrun;

    // Budget increase reduces cashflow risk
    if (budgetAdjustment > 0) {
      const budgetFactor = (budgetAdjustment * 1000000) / baseBudget;
      newRisk -= budgetFactor * 0.15;
      newCostOverrun -= budgetFactor * 0.20;
    } else if (budgetAdjustment < 0) {
      const budgetFactor = Math.abs(budgetAdjustment * 1000000) / baseBudget;
      newRisk += budgetFactor * 0.25;
      newCostOverrun += budgetFactor * 0.35;
    }

    // Schedule extensions reduce immediate delay urgency but increase overall cost overrun
    if (scheduleExtension > 0) {
      newRisk -= (scheduleExtension / 100) * 0.12;
      newCostOverrun += (scheduleExtension / 100) * 0.18;
    } else if (scheduleExtension < 0) {
      newRisk += Math.abs(scheduleExtension / 100) * 0.22;
    }

    // Contractor grade impact
    if (contractorGrade === 'NCA 1') {
      newRisk -= 0.04;
    } else if (['NCA 6', 'NCA 7', 'NCA 8'].includes(contractorGrade)) {
      newRisk += 0.08;
    }

    // Clamp values
    const finalRisk = Math.min(Math.max(newRisk, 0.02), 0.95);
    const finalCostOverrun = Math.min(Math.max(newCostOverrun, 0.5), 65.0);

    setSimulatedRiskProb(finalRisk);
    setSimulatedCostOverrun(finalCostOverrun);

    // Generate AI Copilot Recommended Actions based on simulation state
    const recommendedActions = [];
    if (finalRisk > 0.30) {
      recommendedActions.push({
        title: 'Fast-Track Parallel Substructure Pouring',
        impact: '-12.4% Risk Drop',
        desc: 'Deploy secondary night shift for concrete pouring to eliminate foundation delay buffers.'
      });
    }
    if (finalCostOverrun > 8.0) {
      recommendedActions.push({
        title: 'Re-negotiate Steel Supply Fixed-Rate Contract',
        impact: '-4.8% Cost Overrun',
        desc: 'Lock in bulk structural steel rates with certified NCA suppliers to prevent market fluctuation spikes.'
      });
    }
    if (contractorGrade !== 'NCA 1') {
      recommendedActions.push({
        title: 'Upgrade Lead Civil Contractor to NCA 1',
        impact: '-6.5% Overall Risk',
        desc: 'Partner with Tier-1 NCA contractor for complex multi-story structural framing.'
      });
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push({
        title: 'Optimal Project Trajectory Maintained',
        impact: 'Baseline Secured',
        desc: 'Project parameters remain within safe risk margins. Continue routine site monitoring.'
      });
    }

    setMitigations(recommendedActions);
  }, [budgetAdjustment, scheduleExtension, contractorGrade, baseRisk, baseCostOverrun, baseBudget]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(val);
  };

  const riskDelta = ((simulatedRiskProb - baseRisk) * 100).toFixed(1);
  const adjustedTotalBudget = baseBudget + budgetAdjustment * 1000000;

  return (
    <div className="card-aserre rounded-2xl p-6 shadow-2xl space-y-6 border border-[#D7B66D]/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D7B66D]/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#D7B66D]/15 text-[#D7B66D] rounded-xl border border-[#D7B66D]/30 shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif-luxury text-white tracking-tight">
              Interactive "What-If" Risk Simulator & AI Copilot
            </h3>
            <p className="text-xs text-[#8FA399]">
              Simulate budget, schedule, & contractor adjustments to view real-time recalculated AI predictions
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setBudgetAdjustment(0);
            setScheduleExtension(0);
            setContractorGrade(project.nca_contractor_grade || 'NCA 1');
          }}
          className="text-xs text-[#D7B66D] hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#0B2318] border border-[#D7B66D]/20 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area (Left) */}
        <div className="lg:col-span-7 space-y-5 bg-[#0B2318] p-5 rounded-xl border border-[#D7B66D]/15">
          {/* Budget Adjustment Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#8FA399] uppercase tracking-wider">Budget Adjustment (KSh)</span>
              <span className="text-[#D7B66D] font-mono">
                {budgetAdjustment > 0 ? `+KSh ${budgetAdjustment}M` : budgetAdjustment < 0 ? `-KSh ${Math.abs(budgetAdjustment)}M` : 'KSh 0 (Baseline)'}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="150"
              step="5"
              value={budgetAdjustment}
              onChange={(e) => setBudgetAdjustment(parseFloat(e.target.value))}
              className="w-full accent-[#D7B66D] bg-[#102A25] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8FA399]/70 font-mono">
              <span>-50M KSh</span>
              <span>Baseline: {formatCurrency(baseBudget)}</span>
              <span>+150M KSh</span>
            </div>
          </div>

          {/* Schedule Extension Slider */}
          <div className="space-y-2 pt-2 border-t border-[#D7B66D]/10">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#8FA399] uppercase tracking-wider">Schedule Buffer Extension</span>
              <span className="text-purple-400 font-mono">
                {scheduleExtension > 0 ? `+${scheduleExtension} Days Buffer` : scheduleExtension < 0 ? `${scheduleExtension} Days Accelerated` : '0 Days (Baseline)'}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="90"
              step="5"
              value={scheduleExtension}
              onChange={(e) => setScheduleExtension(parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 bg-[#102A25] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8FA399]/70 font-mono">
              <span>-30 Days</span>
              <span>0 Days</span>
              <span>+90 Days</span>
            </div>
          </div>

          {/* Contractor Grade Selector */}
          <div className="space-y-2 pt-2 border-t border-[#D7B66D]/10">
            <label className="block text-xs font-semibold text-[#8FA399] uppercase tracking-wider">
              NCA Contractor Grade Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['NCA 1', 'NCA 2', 'NCA 3', 'NCA 4'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setContractorGrade(g)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    contractorGrade === g
                      ? 'bg-[#D7B66D]/20 text-[#D7B66D] border-[#D7B66D]'
                      : 'bg-[#102A25] text-[#8FA399] border-[#D7B66D]/20 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulated Output & AI Copilot (Right) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Risk Metrics Comparison Card */}
          <div className="bg-[#102A25] border border-[#D7B66D]/25 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8FA399] uppercase tracking-wider">
              <span>Simulated Risk Prediction</span>
              <span className="text-[#D7B66D] flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1" /> Live ML
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Delay Probability */}
              <div className="bg-[#0B2318] p-3 rounded-lg border border-[#D7B66D]/15">
                <div className="text-[10px] text-[#8FA399] font-medium">Delay Probability</div>
                <div className="text-xl font-bold text-white font-serif-luxury mt-0.5">
                  {(simulatedRiskProb * 100).toFixed(1)}%
                </div>
                <div className={`text-[10px] font-semibold mt-1 ${parseFloat(riskDelta) <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {parseFloat(riskDelta) <= 0 ? `${riskDelta}% improvement` : `+${riskDelta}% risk increase`}
                </div>
              </div>

              {/* Cost Overrun Forecast */}
              <div className="bg-[#0B2318] p-3 rounded-lg border border-[#D7B66D]/15">
                <div className="text-[10px] text-[#8FA399] font-medium">Cost Overrun Est.</div>
                <div className="text-xl font-bold text-purple-300 font-serif-luxury mt-0.5">
                  +{simulatedCostOverrun.toFixed(1)}%
                </div>
                <div className="text-[10px] text-[#8FA399] mt-1">
                  {formatCurrency(adjustedTotalBudget * (simulatedCostOverrun / 100))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Copilot Action Recommendations */}
          <div className="bg-[#0B2318] border border-[#D7B66D]/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#D7B66D] font-serif-luxury">
              <Sparkles className="w-4 h-4 text-[#D7B66D]" />
              <span>AI Copilot Recommended Actions</span>
            </div>

            <div className="space-y-2.5">
              {mitigations.map((m, idx) => (
                <div key={idx} className="bg-[#102A25]/80 border border-[#D7B66D]/15 p-2.5 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{m.title}</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                      {m.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA399] leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
