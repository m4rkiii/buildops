import React, { useState, useEffect } from 'react';
import { getProjectDigest } from '../../services/api';
import { X, Cpu, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Download, Copy, RefreshCw, Crown } from 'lucide-react';

export default function AIDigestModal({ isOpen, onClose, projectId, projectName }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchDigest = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectDigest(projectId);
      setDigest(data.digest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDigest();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!digest) return;
    const reportText = `
BUILD OPS SENTINEL — EXECUTIVE AI DIGEST REPORT
Project: ${projectName}
Timestamp: ${digest.timestamp}
Model Version: ${digest.model_version}

1. EXECUTIVE SUMMARY:
${digest.executive_summary}

2. SCHEDULE VARIANCE ANALYSIS:
${digest.schedule_variance_analysis}

3. FINANCIAL OVERRUN FORECAST:
${digest.financial_overrun_forecast}

4. KEY RISK DRIVERS:
${digest.key_risk_drivers.map(d => `- ${d}`).join('\n')}

5. RECOMMENDED MITIGATIONS:
${digest.recommended_mitigations.map(m => `- ${m}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="ai-digest-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2318]/90 backdrop-blur-md"
    >
      <div className="card-aserre w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#D7B66D]/20 flex items-center justify-between bg-[#0B2318]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#D7B66D]/15 rounded-xl text-[#D7B66D] border border-[#D7B66D]/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-luxury text-white tracking-tight">AI Executive Digest Report</h2>
              <p className="text-xs text-[#8FA399]">Synthesized risk intelligence for {projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8FA399] hover:text-white hover:bg-[#0B2318] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-[#8FA399]">
              <div className="w-8 h-8 border-4 border-[#D7B66D] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium">Generating AI Executive Digest...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Failed to generate digest: {error}</span>
            </div>
          ) : digest ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-[#0B2318] border border-[#D7B66D]/20 p-5 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold font-serif-luxury text-[#D7B66D] uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#D7B66D]" />
                  <span>1. Executive Summary</span>
                </h3>
                <p className="text-[#FAF7F2] leading-relaxed text-xs">{digest.executive_summary}</p>
              </div>

              {/* Schedule & Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B2318] border border-[#D7B66D]/20 p-4 rounded-2xl space-y-2">
                  <h4 className="font-bold font-serif-luxury text-sky-400 text-sm">2. Schedule Variance Analysis</h4>
                  <p className="text-[#FAF7F2] leading-relaxed">{digest.schedule_variance_analysis}</p>
                </div>

                <div className="bg-[#0B2318] border border-[#D7B66D]/20 p-4 rounded-2xl space-y-2">
                  <h4 className="font-bold font-serif-luxury text-emerald-400 text-sm">3. Financial Overrun Forecast</h4>
                  <p className="text-[#FAF7F2] leading-relaxed">{digest.financial_overrun_forecast}</p>
                </div>
              </div>

              {/* Key Risk Drivers */}
              <div className="bg-[#0B2318] border border-[#D7B66D]/20 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold font-serif-luxury text-[#D7B66D] text-sm flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>4. Key Risk Drivers</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {digest.key_risk_drivers.map((driver, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[#FAF7F2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D7B66D] mt-1.5 shrink-0"></span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Mitigations */}
              <div className="bg-[#0B2318] border border-[#D7B66D]/20 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold font-serif-luxury text-emerald-400 text-sm flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>5. Actionable Mitigation Recommendations</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {digest.recommended_mitigations.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[#FAF7F2]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] text-[#8FA399] pt-2 border-t border-[#D7B66D]/20 flex justify-between items-center">
                <span>Model Engine: {digest.model_version}</span>
                <span>Generated: {new Date(digest.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D7B66D]/20 bg-[#0B2318] flex items-center justify-between">
          <button
            onClick={fetchDigest}
            disabled={loading}
            className="text-xs font-semibold text-[#8FA399] hover:text-[#D7B66D] flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Report</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              disabled={!digest}
              className="bg-[#102A25] hover:bg-[#0B2318] border border-[#D7B66D]/30 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5 text-[#D7B66D]" />
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={() => window.print()}
              disabled={!digest}
              className="btn-aserre-gold text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
