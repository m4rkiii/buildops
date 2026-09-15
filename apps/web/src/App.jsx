import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthCallback from './components/Auth/AuthCallback';
import EmailVerificationBanner from './components/Auth/EmailVerificationBanner';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import NotificationCenter from './components/Notifications/NotificationCenter';
import { Shield, CheckCircle2, AlertCircle, LogOut, Crown } from 'lucide-react';

function DashboardContent() {
  const { user, logout, isSupabaseConfigured, authProvider } = useAuth();
  const [activeAuthTab, setActiveAuthTab] = useState('login');
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
    <div className="min-h-screen bg-[#0B2318] text-[#FAF7F2] flex flex-col font-sans">
      {/* Aserre Glass Header */}
      <header className="glass-header-aserre px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[#D7B66D]/10 rounded-xl text-[#D7B66D] border border-[#D7B66D]/30 shadow-lg shadow-[#D7B66D]/5">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold font-serif-luxury tracking-tight text-white">
                BuildOps <span className="text-gold-gradient">Sentinel</span>
              </h1>
            </div>
            <p className="text-xs text-[#8FA399] tracking-wide">Premier Construction Risk Intelligence Platform</p>
          </div>
        </div>

        {/* User Profile & Notification Center */}
        <div className="flex items-center space-x-4">
          {user && <NotificationCenter />}
          {user ? (
            <div className="flex items-center space-x-3 bg-[#102A25] border border-[#D7B66D]/25 rounded-xl px-3.5 py-1.5 shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#D7B66D]/15 text-[#D7B66D] flex items-center justify-center font-bold text-xs border border-[#D7B66D]/30 font-serif-luxury">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white">{user.full_name}</div>
                <div className="text-[10px] text-[#D7B66D] uppercase tracking-wider font-semibold">{user.role}</div>
              </div>
              <button
                onClick={() => { setSelectedProject(null); logout(); }}
                title="Sign Out"
                className="p-1.5 hover:bg-[#0B2318] rounded-lg text-[#8FA399] hover:text-red-400 transition border border-transparent hover:border-red-400/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium badge-aserre-gold">
              Authentication Required
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {!user ? (
          /* Aserre Auth Form Card */
          <div className="max-w-md mx-auto card-aserre rounded-2xl p-7 space-y-6 my-10 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#D7B66D]/10 rounded-2xl mx-auto flex items-center justify-center border border-[#D7B66D]/30 mb-2">
                <Crown className="w-6 h-6 text-[#D7B66D]" />
              </div>
              <h2 className="text-3xl font-bold text-white font-serif-luxury tracking-tight">
                Welcome to <span className="text-gold-gradient">BuildOps</span>
              </h2>
              <p className="text-xs text-[#8FA399]">Sign in to access AI predictive risk analytics & decision support</p>
            </div>

            {/* Aserre Tabs Header */}
            <div className="flex border-b border-[#D7B66D]/20">
              <button
                onClick={() => setActiveAuthTab('login')}
                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
                  activeAuthTab === 'login'
                    ? 'border-[#D7B66D] text-[#D7B66D] font-bold'
                    : 'border-transparent text-[#8FA399] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveAuthTab('register')}
                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
                  activeAuthTab === 'register'
                    ? 'border-[#D7B66D] text-[#D7B66D] font-bold'
                    : 'border-transparent text-[#8FA399] hover:text-white'
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
                <div className="pt-6 border-t border-[#D7B66D]/20">
                  <h3 className="text-sm font-semibold text-[#8FA399] mb-3 uppercase tracking-wider font-serif-luxury text-[#D7B66D]">
                    System Infrastructure Health
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                    <div className="bg-[#102A25] border border-[#D7B66D]/20 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-medium">React Web Dashboard</span>
                      <span className="text-emerald-400 font-semibold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ONLINE
                      </span>
                    </div>

                    <div className="bg-[#102A25] border border-[#D7B66D]/20 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-medium">Supabase Auth Engine</span>
                      <span className={isSupabaseConfigured ? 'text-emerald-400 font-semibold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20' : 'text-amber-400 font-semibold flex items-center bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20'}>
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {isSupabaseConfigured ? 'READY (PKCE)' : 'HYBRID MOCK'}
                      </span>
                    </div>

                    <div className="bg-[#102A25] border border-[#D7B66D]/20 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-medium">Core Express API</span>
                      <span className={apiStatus === 'online' ? 'text-emerald-400 font-semibold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20' : 'text-amber-400 font-semibold flex items-center bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20'}>
                        {apiStatus === 'online' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                        {apiStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-[#102A25] border border-[#D7B66D]/20 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-white font-medium">FastAPI ML Microservice</span>
                      <span className={mlStatus === 'online' ? 'text-emerald-400 font-semibold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20' : 'text-amber-400 font-semibold flex items-center bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20'}>
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

      {/* Aserre Footer */}
      <footer className="border-t border-[#D7B66D]/20 px-6 py-5 text-center text-xs text-[#8FA399]">
        BuildOps Sentinel &copy; 2026 — Premier Real Estate & Construction Risk Intelligence Platform
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
