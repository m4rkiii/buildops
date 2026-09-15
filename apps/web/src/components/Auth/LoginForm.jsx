import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contractor@buildops.co.ke"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full btn-aserre-gold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition disabled:opacity-50 mt-2"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-[#0B2318] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Sign In to BuildOps</span>
          </>
        )}
      </button>
    </form>
  );
}
