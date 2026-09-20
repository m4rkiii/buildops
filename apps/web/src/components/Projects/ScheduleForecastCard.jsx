import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function ScheduleForecastCard({ projectId, token }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
        const res = await fetch(`${API_BASE_URL}/projects/${projectId}/schedule-forecast`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setForecast(data.forecast);
        } else {
          setError('Failed to load schedule forecast');
        }
      } catch (err) {
        setError('Network error fetching schedule forecast');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchForecast();
    }
  }, [projectId, token]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse space-y-2">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-6 bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !forecast) {
    return null;
  }

  const drift = forecast.estimated_schedule_drift_days || 0;
  const isDelayed = drift > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Prophet Schedule Forecast (ML)
          </h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
          forecast.confidence_level === 'HIGH' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {forecast.confidence_level} CONFIDENCE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Projected Completion</span>
          </span>
          <div className="text-base font-bold text-white mt-1">
            {forecast.projected_completion_date}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <AlertTriangle className={`w-3 h-3 ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>Estimated Drift</span>
          </span>
          <div className={`text-base font-bold mt-1 ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isDelayed ? `+${drift} days` : 'On Schedule'}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Pace (Milestones/Mo)</span>
          </span>
          <div className="text-base font-bold text-white mt-1">
            {forecast.velocity_rate_milestones_per_month} / mo
          </div>
        </div>
      </div>
    </div>
  );
}
