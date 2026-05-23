import React, { useState } from 'react';
import { Apple, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { base44 } from '@/api/base44Client';
import { getSafeAuthReturnUrl } from '@/lib/auth-return-url';

const providerLabels = {
  google: 'Google',
  apple: 'Apple',
};

export default function AuthRequiredLogin() {
  const [pendingProvider, setPendingProvider] = useState(null);

  const handleProviderLogin = (provider) => {
    setPendingProvider(provider);
    base44.auth.loginWithProvider(provider, getSafeAuthReturnUrl());
  };

  const isPending = Boolean(pendingProvider);

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbfaf8] text-slate-950 flex items-center justify-center px-5 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#ff6b35] text-white flex items-center justify-center text-2xl font-black shadow-sm">
            R
          </div>
          <h1 className="text-2xl font-black tracking-normal">התחברות ל-Ruumr</h1>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleProviderLogin('google')}
            disabled={isPending}
            className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 shadow-sm flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {pendingProvider === 'google' ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <FcGoogle className="h-5 w-5" aria-hidden="true" />
            )}
            <span>כניסה עם {providerLabels.google}</span>
          </button>

          <button
            type="button"
            onClick={() => handleProviderLogin('apple')}
            disabled={isPending}
            className="h-12 w-full rounded-lg bg-black px-4 text-base font-bold text-white shadow-sm flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {pendingProvider === 'apple' ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Apple className="h-5 w-5" aria-hidden="true" />
            )}
            <span>כניסה עם {providerLabels.apple}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
