import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle2, AlertCircle, Loader2, Crown, ArrowRight } from 'lucide-react';

export default function AuthCallback({ onComplete }) {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const params = new URLSearchParams(search || hash.replace('#', '?'));

        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error || errorDescription) {
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Email confirmation link invalid or expired.');
          return;
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message || 'Failed to exchange authentication code for session.');
            return;
          }
          if (data.session) {
            setStatus('success');
            setTimeout(() => {
              window.location.hash = '';
              if (onComplete) onComplete();
            }, 2500);
            return;
          }
        }

        // Check if session is already active via Supabase listener
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setTimeout(() => {
            window.location.hash = '';
            if (onComplete) onComplete();
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('No authentication code or active session detected.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected authentication callback error occurred.');
      }
    }

    handleCallback();
  }, [onComplete]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="card-aserre rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 bg-[#D7B66D]/15 rounded-2xl mx-auto flex items-center justify-center border border-[#D7B66D]/30 shadow-lg">
          <Crown className="w-7 h-7 text-[#D7B66D]" />
        </div>

        {status === 'processing' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-[#D7B66D] animate-spin" />
            </div>
            <h2 className="text-xl font-bold font-serif-luxury text-white">
              Finalizing Email Verification...
            </h2>
            <p className="text-xs text-[#8FA399]">
              Exchanging PKCE token & synchronizing your security credentials with BuildOps Sentinel.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif-luxury text-white">
              Email Verified Successfully!
            </h2>
            <p className="text-xs text-[#8FA399]">
              Your email address has been confirmed. Redirecting you to your BuildOps construction dashboard...
            </p>
            <button
              onClick={() => { window.location.hash = ''; if (onComplete) onComplete(); }}
              className="btn-aserre-gold w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-500/15 text-red-400 rounded-full mx-auto flex items-center justify-center border border-red-500/30">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold font-serif-luxury text-white">
              Verification Failed
            </h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-300 text-left">
              {errorMessage}
            </div>
            <button
              onClick={() => { window.location.hash = ''; if (onComplete) onComplete(); }}
              className="btn-aserre-gold w-full py-2.5 rounded-xl text-xs font-semibold"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
