import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, UserCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import GoogleButton from './GoogleButton';

const ROLES = [
  { id: 'contractor', label: 'Contractor', desc: 'Manage projects & submit milestones' },
  { id: 'government_officer', label: 'Gov Officer', desc: 'Monitor public project compliance' },
  { id: 'site_supervisor', label: 'Supervisor', desc: 'Log daily site progress' },
  { id: 'homeowner', label: 'Homeowner', desc: 'Track private build progress' },
  { id: 'nca_regulator', label: 'NCA Regulator', desc: 'Read-only regulatory oversight' }
];

export default function RegisterForm({ onSuccess }) {
  const { signUpWithEmail } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contractor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUpWithEmail(email, password, {
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
        <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/30">
          <Mail className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold font-serif-luxury text-white">
            Check Your Email
          </h3>
          <p className="text-xs text-[#8FA399]">
            A confirmation link was dispatched to <strong className="text-white">{email}</strong>.
          </p>
        </div>

        <div className="bg-[#0B2318] border border-[#D7B66D]/20 rounded-xl p-3.5 text-xs text-[#8FA399] text-left space-y-1">
          <div className="flex items-center text-white font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#D7B66D] mr-1.5" />
            Next Steps:
          </div>
          <p>1. Open your email inbox.</p>
          <p>2. Click the verification link to confirm your account.</p>
          <p>3. You will be automatically redirected back to BuildOps Sentinel.</p>
        </div>

        <button
          onClick={onSuccess}
          className="btn-aserre-gold w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="w-4 h-4" />
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
        <div className="flex-grow border-t border-[#D7B66D]/20"></div>
        <span className="flex-shrink mx-3 text-[10px] text-[#8FA399] uppercase tracking-wider font-semibold">Or Register with Email</span>
        <div className="flex-grow border-t border-[#D7B66D]/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Full Name *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Eng. Maina Kamau"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Email Address *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maina@buildops.co.ke"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Password (Min 6 chars) *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Phone Number Input */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Phone Number (Optional)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8FA399]">
            <Phone className="w-4 h-4" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+254712345678"
            className="w-full bg-[#0B2318] border border-[#D7B66D]/30 focus:border-[#D7B66D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8FA399]/60 focus:outline-none focus:ring-1 focus:ring-[#D7B66D] transition"
          />
        </div>
      </div>

      {/* Role Selection Grid */}
      <div>
        <label className="block text-xs font-semibold text-[#D7B66D] mb-1.5 uppercase tracking-wider">Select Platform Role *</label>
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
          {ROLES.map((r) => (
            <div
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                role === r.id
                  ? 'bg-[#D7B66D]/15 border-[#D7B66D] text-[#D7B66D]'
                  : 'bg-[#0B2318] border-[#D7B66D]/20 text-[#8FA399] hover:border-[#D7B66D]/40'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">{r.label}</div>
                <div className="text-[11px] text-[#8FA399]">{r.desc}</div>
              </div>
              {role === r.id && <UserCheck className="w-4 h-4 shrink-0 text-[#D7B66D]" />}
            </div>
          ))}
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
            <UserCheck className="w-4 h-4" />
            <span>Create BuildOps Account</span>
          </>
        )}
      </button>
    </form>
  </div>
);
}
