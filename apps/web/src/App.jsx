import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { Shield, Activity, Server, Cpu, CheckCircle2, AlertCircle, User, LogOut } from 'lucide-react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
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

        {/* User Profile / Auth Status Widget */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/20">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white">{user.full_name}</div>
                <div className="text-[10px] text-sky-400 uppercase font-medium">{user.role}</div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Authentication Required
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {!user ? (
          /* Auth Form Card */
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to BuildOps</h2>
              <p className="text-xs text-slate-400">Sign in to manage construction risk intelligence</p>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                  activeTab === 'login'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                  activeTab === 'register'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Tab Form Content */}
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm onSuccess={() => setActiveTab('login')} />}
          </div>
        ) : (
          /* Protected Main Dashboard Area */
          <ProtectedRoute>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-sky-900/30 to-indigo-900/30 border border-sky-500/20 rounded-xl p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {user.full_name}!</h2>
                    <p className="text-slate-300 text-sm max-w-xl">
                      Authenticated as <span className="text-sky-400 font-semibold uppercase">{user.role}</span>. Core API auth and user session actively maintained.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                    Authenticated Session Active
                  </span>
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
            </div>
          </ProtectedRoute>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500">
        BuildOps Sentinel &copy; 2026 — AI Predictive Risk Intelligence Platform (Sprint C1)
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
