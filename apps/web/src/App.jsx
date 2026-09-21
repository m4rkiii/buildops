import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import GoogleButton from './components/Auth/GoogleButton';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthCallback from './components/Auth/AuthCallback';
import EmailVerificationBanner from './components/Auth/EmailVerificationBanner';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import NotificationCenter from './components/Notifications/NotificationCenter';
import { Shield, CheckCircle2, AlertCircle, LogOut, Crown } from 'lucide-react';

function DashboardContent() {
  const { user, logout, isSupabaseConfigured } = useAuth();
  const [selectedProject, setSelectedProject] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [mlStatus, setMlStatus] = useState('checking');
  const [isCallbackRoute, setIsCallbackRoute] = useState(
    window.location.hash.includes('auth-callback') || window.location.search.includes('code=')
  );

  useEffect(() => {
    const handleHashChange = () => {
      setIsCallbackRoute(
        window.location.hash.includes('auth-callback') || window.location.search.includes('code=')
      );
    };

    window.addEventListener('hashchange', handleHashChange);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
    const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || 'http://localhost:8000';

    // Check API health
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setApiStatus(data.status === 'ok' ? 'online' : 'error'))
      .catch(() => setApiStatus('offline'));

    // Check ML Service health
    fetch(`${ML_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setMlStatus(data.status === 'ok' ? 'online' : 'error'))
      .catch(() => setMlStatus('offline'));

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isCallbackRoute) {
    return (
      <div className="min-h-screen bg-[#0B2318] text-[#FAF7F2] flex flex-col font-sans justify-center">
        <AuthCallback onComplete={() => setIsCallbackRoute(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      <header className="glass-header-aserre px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-zinc-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-zinc-900 rounded-xl text-white border border-zinc-700 shadow-md">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                BuildOps <span className="text-zinc-400">Sentinel</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 tracking-wide font-medium">Premier Construction Risk Intelligence Platform</p>
          </div>
        </div>

        {/* User Profile & Notification Center */}
        <div className="flex items-center space-x-4">
          {user && <NotificationCenter />}
          {user ? (
            <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-1.5 shadow-md">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full border border-zinc-600 object-cover shrink-0 grayscale hover:grayscale-0 transition"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-xs border border-zinc-600 shrink-0">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white">{user.full_name}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">{user.role}</div>
              </div>
              <button
                onClick={() => { setSelectedProject(null); logout(); }}
                title="Sign Out"
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition border border-transparent hover:border-zinc-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white border border-zinc-700">
              Authentication Required
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {!user ? (
          /* Google Authentication Only Card */
          <div className="max-w-md mx-auto card-aserre rounded-2xl p-8 space-y-6 my-12 shadow-2xl text-center border border-zinc-800 bg-zinc-950">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center border border-zinc-700 mb-3 shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Welcome to <span className="text-zinc-400">BuildOps</span>
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sign in with your Google account to access AI predictive risk analytics & decision support.
              </p>
            </div>

            {/* Google OAuth Login Button */}
            <div className="pt-2">
              <GoogleButton label="Continue with Google" />
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-800 font-medium">
              Secure authentication powered by Google OAuth & Supabase Security
            </div>
          </div>
        ) : (
          /* Protected Main Dashboard Area */
          <ProtectedRoute>
            <EmailVerificationBanner />
            {selectedProject ? (
              <ProjectDetail
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
              />
            ) : (
              <div className="space-y-6">
                <ProjectList onSelectProject={(proj) => setSelectedProject(proj)} />

                {/* System Services Health */}
                <div className="pt-6 border-t border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
                    System Infrastructure Health
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">React Web Dashboard</span>
                      <span className="text-white font-bold flex items-center bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" /> ONLINE
                      </span>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">Supabase Auth Engine</span>
                      <span className="text-white font-bold flex items-center bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                        <Shield className="w-3.5 h-3.5 mr-1 text-white" />
                        {isSupabaseConfigured ? 'READY (PKCE)' : 'HYBRID MOCK'}
                      </span>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">Core Express API</span>
                      <span className="text-white font-bold flex items-center bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                        {apiStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" /> : <AlertCircle className="w-3.5 h-3.5 mr-1 text-white" />}
                        {apiStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">FastAPI ML Microservice</span>
                      <span className="text-white font-bold flex items-center bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                        {mlStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" /> : <AlertCircle className="w-3.5 h-3.5 mr-1 text-white" />}
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
      <footer className="border-t border-zinc-800 px-6 py-5 text-center text-xs text-zinc-500 font-medium">
        BuildOps Construction Ltd
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
