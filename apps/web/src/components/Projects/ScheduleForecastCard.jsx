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
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 animate-pulse space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !forecast) {
    return null;
  }

  const drift = forecast.estimated_schedule_drift_days || 0;
  const isDelayed = drift > 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-white" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Prophet Schedule Forecast (ML)
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white text-black border-white">
          {forecast.confidence_level} CONFIDENCE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-black border border-zinc-800 rounded-lg p-3">
          <span className="text-[11px] text-zinc-400 flex items-center space-x-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>Projected Completion</span>
          </span>
          <div className="text-base font-bold text-white mt-1">
            {forecast.projected_completion_date}
          </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-lg p-3">
          <span className="text-[11px] text-zinc-400 flex items-center space-x-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>Estimated Drift</span>
          </span>
          <div className="text-base font-bold mt-1 text-white">
            {isDelayed ? `+${drift} days` : 'On Schedule'}
          </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-lg p-3">
          <span className="text-[11px] text-zinc-400 flex items-center space-x-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
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
