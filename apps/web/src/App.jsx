import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import { Shield, Activity, Server, Cpu, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [activeAuthTab, setActiveAuthTab] = useState('login');
  const [selectedProject, setSelectedProject] = useState(null);
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
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
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
                onClick={() => { setSelectedProject(null); logout(); }}
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
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to BuildOps</h2>
              <p className="text-xs text-slate-400">Sign in to manage construction risk intelligence</p>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveAuthTab('login')}
                className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                  activeAuthTab === 'login'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveAuthTab('register')}
                className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                  activeAuthTab === 'register'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Tab Form Content */}
            {activeAuthTab === 'login' ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={() => setActiveAuthTab('login')} />
            )}
          </div>
        ) : (
          /* Protected Main Dashboard Area */
          <ProtectedRoute>
            {selectedProject ? (
              <ProjectDetail
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
                  <p>Milestone Timeline & Management view slot (Sprint C3)</p>
                </div>
              </ProjectDetail>
            ) : (
              <div className="space-y-6">
                <ProjectList onSelectProject={(proj) => setSelectedProject(proj)} />

                {/* System Services Status */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">System Services Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Web Dashboard</span>
                      <span className="text-emerald-400 font-semibold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> RUNNING
                      </span>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Core Express API</span>
                      <span className={apiStatus === 'online' ? 'text-emerald-400 font-semibold flex items-center' : 'text-amber-400 font-semibold flex items-center'}>
                        {apiStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                        {apiStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">FastAPI ML Service</span>
                      <span className={mlStatus === 'online' ? 'text-emerald-400 font-semibold flex items-center' : 'text-amber-400 font-semibold flex items-center'}>
                        {mlStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                        {mlStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ProtectedRoute>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500">
        BuildOps Sentinel &copy; 2026 — AI Predictive Risk Intelligence Platform (Sprint C2)
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
