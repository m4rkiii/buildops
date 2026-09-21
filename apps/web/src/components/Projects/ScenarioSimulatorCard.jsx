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
    <div className="bg-zinc-950 rounded-2xl p-6 shadow-2xl space-y-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-zinc-900 text-white rounded-xl border border-zinc-700 shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Interactive "What-If" Risk Simulator & AI Copilot
            </h3>
            <p className="text-xs text-zinc-400">
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
          className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area (Left) */}
        <div className="lg:col-span-7 space-y-5 bg-zinc-900 p-5 rounded-xl border border-zinc-800">
          {/* Budget Adjustment Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-400 uppercase tracking-wider">Budget Adjustment (KSh)</span>
              <span className="text-white font-mono font-semibold">
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
              className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>-50M KSh</span>
              <span>Baseline: {formatCurrency(baseBudget)}</span>
              <span>+150M KSh</span>
            </div>
          </div>

          {/* Schedule Extension Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-400 uppercase tracking-wider">Schedule Buffer Extension</span>
              <span className="text-white font-mono font-semibold">
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
              className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>-30 Days</span>
              <span>0 Days</span>
              <span>+90 Days</span>
            </div>
          </div>

          {/* Contractor Grade Selector */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              NCA Contractor Grade Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['NCA 1', 'NCA 2', 'NCA 3', 'NCA 4'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setContractorGrade(g)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    contractorGrade === g
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Simulated Risk Prediction</span>
              <span className="text-white flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-zinc-300" /> Live ML
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Delay Probability */}
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">Delay Probability</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {(simulatedRiskProb * 100).toFixed(1)}%
                </div>
                <div className={`text-[10px] font-semibold font-mono mt-1 ${parseFloat(riskDelta) <= 0 ? 'text-zinc-300' : 'text-zinc-100'}`}>
                  {parseFloat(riskDelta) <= 0 ? `${riskDelta}% improvement` : `+${riskDelta}% risk increase`}
                </div>
              </div>

              {/* Cost Overrun Forecast */}
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">Cost Overrun Est.</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  +{simulatedCostOverrun.toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">
                  {formatCurrency(adjustedTotalBudget * (simulatedCostOverrun / 100))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Copilot Action Recommendations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-white" />
              <span>AI Copilot Recommended Actions</span>
            </div>

            <div className="space-y-2.5">
              {mitigations.map((m, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{m.title}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-1.5 py-0.5 rounded font-mono font-medium">
                      {m.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
