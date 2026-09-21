import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmailVerificationBanner() {
  const { user, resendVerificationEmail, isEmailUnverified } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // 'success' | 'error' | null

  if (!isEmailUnverified || !user) return null;

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      await resendVerificationEmail(user.email);
      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5 shadow-2xl mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-zinc-800 text-white rounded-xl border border-zinc-600 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Please Verify Your Email Address
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              A verification link was sent to <strong className="text-white">{user.email}</strong>. Please check your inbox and confirm your email to activate full platform access.
            </p>
            {resendStatus === 'success' && (
              <div className="mt-2.5 p-2 bg-black border border-zinc-700 rounded-lg text-xs text-white flex items-center font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-white shrink-0" />
                Verification email resent successfully! Check your inbox.
              </div>
            )}
            {resendStatus === 'error' && (
              <div className="mt-2.5 p-2 bg-black border border-zinc-500 rounded-lg text-xs text-zinc-200 flex items-center font-bold">
                <AlertCircle className="w-4 h-4 mr-1.5 text-zinc-200 shrink-0" />
                Could not resend email. Please try again shortly.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleResend}
          disabled={resending}
          className="bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center space-x-2 transition border border-zinc-300 disabled:opacity-50"
        >
          {resending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-black" />
              <span>Resend Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
