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
    <div className="bg-[#102A25] border border-[#D7B66D]/30 rounded-2xl p-4 shadow-xl mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-[#D7B66D]/15 text-[#D7B66D] rounded-xl border border-[#D7B66D]/30 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-serif-luxury">
              Please Verify Your Email Address
            </h4>
            <p className="text-xs text-[#8FA399] mt-0.5">
              A verification link was sent to <strong className="text-white">{user.email}</strong>. Please check your inbox and confirm your email to activate full platform access.
            </p>
            {resendStatus === 'success' && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Verification email resent successfully! Check your inbox.
              </div>
            )}
            {resendStatus === 'error' && (
              <div className="mt-2 text-xs text-red-400 flex items-center font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Could not resend email. Please try again shortly.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleResend}
          disabled={resending}
          className="btn-aserre-gold px-4 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center space-x-1.5 transition disabled:opacity-50"
        >
          {resending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
