import React, { useState, useEffect } from 'react';
import { Shield, Activity, Server, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [mlStatus, setMlStatus] = useState('checking');

  useEffect(() => {
    // Check API health
    fetch('http://localhost:5000/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status === 'ok' ? 'online' : 'error'))
      .catch(() => setApiStatus('offline'));

    // Check ML Service health
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setMlStatus(data.status === 'ok' ? 'online' : 'error'))
      .catch(() => setMlStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">BuildOps Sentinel</h1>
            <p className="text-xs text-slate-400">AI Predictive Risk Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Sprint A1 Active
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-gradient-to-r from-sky-900/30 to-indigo-900/30 border border-sky-500/20 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Monorepo Foundation Scaffold</h2>
            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
              Sprint A1 architecture successfully initialized with React 18 dashboard, Node.js Express API, and Python FastAPI ML Service.
            </p>
          </div>
        </div>

        {/* Microservices Health Status */}
        <h3 className="text-lg font-semibold text-slate-200">System Services Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Frontend Web */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Web Dashboard</h4>
                  <p className="text-xs text-slate-400">React 18 + Tailwind</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Port 5173</span>
              <span className="text-emerald-400 font-medium">Running</span>
            </div>
          </div>

          {/* Express API */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Core API Service</h4>
                  <p className="text-xs text-slate-400">Node.js 20 + Express</p>
                </div>
              </div>
              {apiStatus === 'online' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Port 5000</span>
              <span className={apiStatus === 'online' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {apiStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* FastAPI ML Service */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">ML Microservice</h4>
                  <p className="text-xs text-slate-400">Python 3.11 + FastAPI</p>
                </div>
              </div>
              {mlStatus === 'online' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Port 8000</span>
              <span className={mlStatus === 'online' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {mlStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500">
        BuildOps Sentinel &copy; 2026 — Monorepo Architecture Scaffold (Sprint A1)
      </footer>
    </div>
  );
}
