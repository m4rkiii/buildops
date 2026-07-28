import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, UserCheck, AlertCircle } from 'lucide-react';

const ROLES = [
  { id: 'contractor', label: 'Contractor', desc: 'Manage projects & submit milestones' },
  { id: 'government_officer', label: 'Gov Officer', desc: 'Monitor public project compliance' },
  { id: 'site_supervisor', label: 'Supervisor', desc: 'Log daily site progress' },
  { id: 'homeowner', label: 'Homeowner', desc: 'Track private build progress' },
  { id: 'nca_regulator', label: 'NCA Regulator', desc: 'Read-only regulatory oversight' }
];

export default function RegisterForm({ onSuccess }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contractor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      await register({
        full_name: fullName,
        email,
        password,
        role,
        phone_number: phoneNumber || undefined
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Eng. Maina Kamau"
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maina@buildops.co.ke"
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Password (Min 6 chars)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Phone Number Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+254712345678"
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Role Selection Grid */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Your Platform Role</label>
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
          {ROLES.map((r) => (
            <div
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                role === r.id
                  ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-white">{r.label}</div>
                <div className="text-[11px] text-slate-400">{r.desc}</div>
              </div>
              {role === r.id && <UserCheck className="w-4 h-4 shrink-0 text-sky-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <UserCheck className="w-4 h-4" />
            <span>Create BuildOps Account</span>
          </>
        )}
      </button>
    </form>
  );
}
