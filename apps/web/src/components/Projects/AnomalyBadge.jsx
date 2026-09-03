import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AnomalyBadge({ projectId, token }) {
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnomaly() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/projects/${projectId}/anomaly-check`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAnomaly(data.anomaly);
        }
      } catch (err) {
        // Silent catch for anomaly component
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchAnomaly();
    }
  }, [projectId, token]);

  if (loading || !anomaly) return null;

  if (!anomaly.is_anomaly) {
    return (
      <div className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Metrics Normal</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-400">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Isolation Forest Anomaly Detected</span>
        </div>
        <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
          Anomaly Score: {(anomaly.anomaly_score * 100).toFixed(1)}%
        </span>
      </div>
      {anomaly.detected_outliers && anomaly.detected_outliers.length > 0 && (
        <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-300/90 pl-1">
          {anomaly.detected_outliers.map((outlier, idx) => (
            <li key={idx}>{outlier}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
