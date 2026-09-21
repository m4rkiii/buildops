import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import GoogleButton from './GoogleButton';

const DEMO_ACCOUNTS = [
  { label: 'Contractor', email: 'contractor@buildops.co.ke' },
  { label: 'NCA Regulator', email: 'regulator@nca.go.ke' },
  { label: 'Gov Officer', email: 'officer@infrastructure.go.ke' },
  { label: 'Supervisor', email: 'supervisor@buildops.co.ke' },
  { label: 'Homeowner', email: 'homeowner@buildops.co.ke' },
];

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Google OAuth Authentication */}
      <GoogleButton label="Sign in with Google" />

      {/* Divider */}
      <div className="relative flex items-center my-2">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-3 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Or Sign In with Email</span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick Demo Fill Pills */}
      <div>
        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
          Quick Demo Autofill
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillDemo(acc.email)}
              className="px-2.5 py-1 text-[11px] font-bold bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white rounded-lg transition"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-zinc-900 border border-white rounded-xl p-3.5 flex items-start space-x-2 text-white text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contractor@buildops.co.ke"
            className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-white hover:bg-zinc-200 text-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm font-bold transition disabled:opacity-50 mt-2 border border-zinc-300"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <LogIn className="w-4 h-4 text-black" />
            <span>Sign In to BuildOps</span>
          </>
        )}
      </button>
    </form>
  </div>
);
}
