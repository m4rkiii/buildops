import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, User, RefreshCw, CheckCircle2 } from 'lucide-react';
import GoogleButton from './GoogleButton';

const DEMO_ACCOUNTS = [
  { label: 'Contractor', identifier: 'contractor@buildops.co.ke' },
  { label: 'NCA Regulator', identifier: 'regulator@nca.go.ke' },
  { label: 'Gov Officer', identifier: 'officer@infrastructure.go.ke' },
  { label: 'Supervisor', identifier: 'supervisor@buildops.co.ke' },
  { label: 'Homeowner', identifier: 'homeowner@buildops.co.ke' },
];

export default function LoginForm({ onSuccess }) {
  const { signInWithUsernameOrEmail, resendVerificationEmail } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = (demoIdentifier) => {
    setIdentifier(demoIdentifier);
    setPassword('Password123!');
    setError(null);
    setIsUnconfirmed(false);
    setResendSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsUnconfirmed(false);
    setResendSuccess(false);

    if (!identifier || !password) {
      setError('Please enter your username or email, and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithUsernameOrEmail(identifier, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.isEmailUnconfirmed) {
        setIsUnconfirmed(true);
        setUnconfirmedEmail(err.resolvedEmail || identifier);
        setError('Your email address has not been confirmed yet. Please verify your inbox before signing in.');
      } else {
        setError(err.message || 'Invalid login credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Google OAuth Authentication */}
      <GoogleButton label="Sign in with Google" />

      {/* Divider */}
      <div className="relative flex items-center my-2">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-3 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Or Sign In with Username / Email</span>
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
                key={acc.identifier}
                type="button"
                onClick={() => fillDemo(acc.identifier)}
                className="px-2.5 py-1 text-[11px] font-bold bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white rounded-lg transition"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-zinc-900 border border-white rounded-xl p-3.5 space-y-2 text-white text-xs font-medium">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
              <span className="leading-snug">{error}</span>
            </div>

            {/* Email Unconfirmed Resend Action */}
            {isUnconfirmed && (
              <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                {resendSuccess ? (
                  <div className="flex items-center space-x-1.5 text-zinc-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Confirmation email resent! Please check your inbox.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full bg-white hover:bg-zinc-200 text-black py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition border border-zinc-300 disabled:opacity-50"
                  >
                    {resending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>Resend Confirmation Email to {unconfirmedEmail}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Username or Email Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
            Username or Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              {identifier.includes('@') ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username or email address"
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

