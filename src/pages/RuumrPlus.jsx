import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Share2, CheckCircle2, Sparkles, Zap, Clock } from 'lucide-react';
import { profileBoosts } from '@/api/profileBoosts';

const BOOST_MS = 24 * 60 * 60 * 1000;

export default function RuumrPlus() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let mounted = true;
    setLoading(true); setError(null);
    profileBoosts('status').then(x => { if (mounted) setStatus(x); }).catch(e => {
      if (mounted) setError(e?.response?.data?.error === 'profile_required' || e.code === 'profile_required' ? 'boost_profile_required' : 'boost_error');
    }).finally(() => { if (mounted) setLoading(false); });
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, [retry]);
  const active = status?.expiresAt && Date.parse(status.expiresAt) > now;
  const eligible = status && (!status.nextEligibleAt || Date.parse(status.nextEligibleAt) <= now);
  const date = value => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const msLeft = active ? Date.parse(status.expiresAt) - now : 0;
  const pctLeft = active ? Math.max(0, Math.min(100, (msLeft / BOOST_MS) * 100)) : 0;
  async function share() {
    setBusy(true); setError(null); setShared(false); setCopied(false);
    try {
      if (navigator.share) await navigator.share({ title: 'RUUMR', text: t('boost_share_text'), url: 'https://app.ruumrapp.com' });
      else { await navigator.clipboard.writeText(`${t('boost_share_text')} https://app.ruumrapp.com`); setCopied(true); }
      setShared(true);
    } catch (e) { if (e.name !== 'AbortError') setError('boost_share_error'); }
    finally { setBusy(false); }
  }
  async function claim() {
    setBusy(true); setError(null);
    try { setStatus(await profileBoosts('claim', { confirmedShared: true })); setShared(false); }
    catch { setError('boost_error'); }
    finally { setBusy(false); }
  }
  return (
    <main dir={i18n.dir()} className="max-w-lg mx-auto px-5 pb-28 pt-3 text-center flex flex-col">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-orange-600 to-rose-500 px-6 py-9 text-white shadow-xl shadow-orange-500/30"
      >
        <div className="pointer-events-none absolute -top-12 -end-12 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -start-12 h-44 w-44 rounded-full bg-amber-300/30 blur-2xl" />
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative inline-flex"
        >
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/30 backdrop-blur-sm">
            <Rocket className="h-10 w-10" />
          </div>
          <Sparkles className="absolute -top-2 -end-2 h-6 w-6 text-yellow-200 drop-shadow" />
        </motion.div>
        <h1 className="relative mt-5 text-3xl font-extrabold tracking-tight leading-tight drop-shadow-sm">{t('boost_title')}</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-white/90">{t('boost_description')}</p>
      </motion.section>

      {/* Limits badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30"
      >
        <Zap className="h-4 w-4" />
        {t('boost_limits')}
      </motion.div>

      {/* Body */}
      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                className="mx-auto w-full rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 ring-1 ring-emerald-200 dark:from-emerald-500/10 dark:to-teal-500/10 dark:ring-emerald-500/30"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-3 text-xl font-bold text-emerald-700 dark:text-emerald-300">{t('boost_active')}</h2>
                <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/80">{t('boost_until', { date: date(status.expiresAt) })}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${pctLeft}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  />
                </div>
              </motion.div>
            )}

            {!active && !eligible && status?.nextEligibleAt && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto w-full rounded-3xl bg-gray-50 p-6 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                  <Clock className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('boost_next', { date: date(status.nextEligibleAt) })}</p>
              </motion.div>
            )}

            {eligible && !active && !shared && (
              <motion.div
                key="share"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={busy}
                  onClick={share}
                  className="group relative rounded-full bg-gradient-to-br from-orange-500 to-orange-600 px-10 py-4 text-lg font-extrabold text-white shadow-xl shadow-orange-500/30 transition disabled:opacity-50"
                >
                  <span className="absolute inset-0 rounded-full bg-orange-400/40 blur-xl transition group-hover:bg-orange-400/60" />
                  <span className="relative inline-flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    {t(busy ? 'boost_working' : 'boost_share')}
                  </span>
                </motion.button>
              </motion.div>
            )}

            {shared && eligible && !active && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className="mx-auto w-full rounded-3xl bg-blue-50 p-6 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30"
              >
                <p className="text-sm text-blue-700 dark:text-blue-200">{t(copied ? 'boost_copied' : 'boost_confirm_description')}</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={busy}
                  onClick={claim}
                  className="mt-4 rounded-full bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {t('boost_confirm')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p role="alert" className="mt-5 text-sm font-semibold text-red-600">{t(error)}</p>}
          {error === 'boost_error' && !status && (
            <button onClick={() => setRetry(value => value + 1)} className="mt-3 text-sm font-semibold text-orange-600 underline">{t('boost_retry')}</button>
          )}
          {error === 'boost_profile_required' && (
            <Link className="mt-3 inline-block text-sm font-semibold text-orange-600 underline" to="/Onboarding">{t('boost_create_profile')}</Link>
          )}
        </div>
      )}

      <Link
        to="/Discover?view=people"
        className="mx-auto mt-8 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {t('boost_back')}
      </Link>
    </main>
  );
}