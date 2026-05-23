import React, { useState } from 'react';
import { Apple, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/lib/AuthContext';

const providers = [
  { id: 'google', label: 'Google', Icon: FcGoogle, className: 'border border-slate-200 bg-white text-slate-900' },
  { id: 'apple', label: 'Apple', Icon: Apple, className: 'bg-black text-white' },
];

export default function NativeAuthLogin() {
  const { loginWithProvider } = useAuth();
  const [pendingProvider, setPendingProvider] = useState(null);

  const handleLogin = async (provider) => {
    setPendingProvider(provider);
    try {
      await loginWithProvider(provider);
    } catch (error) {
      console.error('[ruumr] native provider login failed:', error);
      setPendingProvider(null);
    }
  };

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
          {providers.map(({ id, label, Icon, className }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleLogin(id)}
              disabled={Boolean(pendingProvider)}
              className={`h-12 w-full rounded-lg px-4 text-base font-bold shadow-sm flex items-center justify-center gap-3 disabled:opacity-70 ${className}`}
            >
              {pendingProvider === id ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className="h-5 w-5" aria-hidden="true" />
              )}
              <span>כניסה עם {label}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
