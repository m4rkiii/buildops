import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, UserCheck, AlertCircle, CheckCircle2, ArrowRight, AtSign, Loader2, XCircle } from 'lucide-react';
import GoogleButton from './GoogleButton';

const ROLES = [
  { id: 'contractor', label: 'Contractor', desc: 'Manage projects & submit milestones' },
  { id: 'government_officer', label: 'Gov Officer', desc: 'Monitor public project compliance' },
  { id: 'site_supervisor', label: 'Supervisor', desc: 'Log daily site progress' },
  { id: 'homeowner', label: 'Homeowner', desc: 'Track private build progress' },
  { id: 'nca_regulator', label: 'NCA Regulator', desc: 'Read-only regulatory oversight' }
];

export default function RegisterForm({ onSuccess }) {
  const { signUpWithUsername, checkUsernameAvailability } = useAuth();
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken' | 'invalid' | null
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contractor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  // Debounced username availability check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus(null);
      return;
    }

    if (trimmed.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(trimmed);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        setUsernameStatus(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !fullName || !email || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose another.');
      return;
    }

    if (usernameStatus === 'invalid') {
      setError('Username must be 3-30 characters (letters, numbers, underscores, or hyphens).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUpWithUsername(username, email, password, {
        full_name: fullName,
        role,
        phone_number: phoneNumber || undefined
      });

      if (res?.isUnverified) {
        setVerificationPending(true);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="space-y-5 pt-2 text-center">
        <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl mx-auto flex items-center justify-center border border-zinc-700">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Verify Your Email
          </h3>
          <p className="text-xs text-zinc-400">
            A confirmation email was sent to <strong className="text-white">{email}</strong>.
          </p>
        </div>

        <div className="bg-black border border-zinc-700 rounded-xl p-4 text-xs text-zinc-300 text-left space-y-2">
          <div className="flex items-center text-white font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-white mr-1.5 shrink-0" />
            Mandatory Verification Steps:
          </div>
          <p className="text-zinc-400">1. Open your inbox for <strong>{email}</strong>.</p>
          <p className="text-zinc-400">2. Click the confirmation link to activate your username <strong>@{username}</strong>.</p>
          <p className="text-zinc-400">3. Return here to sign in with your username or email.</p>
        </div>

        <button
          onClick={onSuccess}
          className="bg-white hover:bg-zinc-200 text-black w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition border border-zinc-300"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Google OAuth Register/Login */}
      <GoogleButton label="Sign up with Google" />

      {/* Divider */}
      <div className="relative flex items-center my-2">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-3 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Or Register with Username</span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-zinc-900 border border-white rounded-xl p-3.5 flex items-start space-x-2 text-white text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
            <span>{error}</span>
          </div>
        )}

        {/* Username Input with Availability Status */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Username *</label>
            {usernameStatus === 'checking' && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" /> Checking...
              </span>
            )}
            {usernameStatus === 'available' && (
              <span className="text-[11px] text-zinc-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Available
              </span>
            )}
            {usernameStatus === 'taken' && (
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-zinc-400" /> Username taken
              </span>
            )}
            {usernameStatus === 'invalid' && (
              <span className="text-[11px] text-zinc-400">Min 3 chars (a-z, 0-9, _)</span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <AtSign className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="maina_kamau"
              className={`w-full bg-black border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition ${
                usernameStatus === 'available'
                  ? 'border-white focus:ring-white'
                  : usernameStatus === 'taken'
                  ? 'border-zinc-500 focus:ring-zinc-400'
                  : 'border-zinc-700 focus:border-white focus:ring-white'
              }`}
            />
          </div>
        </div>

        {/* Full Name Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Full Name *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Eng. Maina Kamau"
              className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Email Address *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maina@buildops.co.ke"
              className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Password (Min 6 chars) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Phone Number (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254712345678"
              className="w-full bg-black border border-zinc-700 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>
        </div>

        {/* Role Selection Grid */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">Select Platform Role *</label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
            {ROLES.map((r) => (
              <div
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                  role === r.id
                    ? 'bg-white border-white text-black font-bold shadow-md'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${role === r.id ? 'text-black' : 'text-white'}`}>{r.label}</div>
                  <div className={`text-[11px] ${role === r.id ? 'text-zinc-700' : 'text-zinc-400'}`}>{r.desc}</div>
                </div>
                {role === r.id && <UserCheck className="w-4 h-4 shrink-0 text-black" />}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
          className="w-full bg-white hover:bg-zinc-200 text-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm font-bold transition disabled:opacity-50 mt-2 border border-zinc-300"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-black" />
              <span>Create BuildOps Account</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

