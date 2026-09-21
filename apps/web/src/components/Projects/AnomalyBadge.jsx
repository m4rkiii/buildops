import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AnomalyBadge({ projectId, token }) {
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnomaly() {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
        const res = await fetch(`${API_BASE_URL}/projects/${projectId}/anomaly-check`, {
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
      <div className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-900 text-white border border-zinc-700">
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        <span>Metrics Normal</span>
      </div>
    );
  }

  return (
    <div className="bg-black border border-white rounded-xl p-4 text-white space-y-2 font-medium">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-white">
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>Isolation Forest Anomaly Detected</span>
        </div>
        <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded border border-white">
          Anomaly Score: {(anomaly.anomaly_score * 100).toFixed(1)}%
        </span>
      </div>
      {anomaly.detected_outliers && anomaly.detected_outliers.length > 0 && (
        <ul className="list-disc list-inside text-xs space-y-0.5 text-zinc-300 pl-1 font-medium">
          {anomaly.detected_outliers.map((outlier, idx) => (
            <li key={idx}>{outlier}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
