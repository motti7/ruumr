import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Rocket, Share2, CheckCircle2 } from 'lucide-react';
import { profileBoosts } from '@/api/profileBoosts';

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
 return <main dir={i18n.dir()} className="max-w-lg mx-auto px-6 py-10 pb-28 text-center">
  <div className="inline-flex rounded-full bg-orange-100 p-5 text-orange-600"><Rocket size={40} aria-hidden="true" /></div>
  <h1 className="text-3xl font-bold mt-5">{t('boost_title')}</h1>
  <p className="text-gray-600 mt-4">{t('boost_description')}</p>
  <p className="text-sm text-gray-500 mt-3">{t('boost_limits')}</p>
  <section className="rounded-3xl border border-orange-100 bg-white p-6 mt-7 shadow-sm" aria-busy={loading || busy}>
   {loading ? <p role="status">{t('loading')}</p> : <>
    {active && <div role="status"><CheckCircle2 className="mx-auto text-orange-600" aria-hidden="true" /><h2 className="font-bold mt-2">{t('boost_active')}</h2><p>{t('boost_until', { date: date(status.expiresAt) })}</p></div>}
    {!eligible && status?.nextEligibleAt && <p className="text-sm mt-4">{t('boost_next', { date: date(status.nextEligibleAt) })}</p>}
    {eligible && <button disabled={busy} onClick={share} className="rounded-full bg-orange-600 text-white px-6 py-3 w-full font-bold disabled:opacity-50"><Share2 className="inline-block me-2" size={20} aria-hidden="true" />{t(busy ? 'boost_working' : 'boost_share')}</button>}
    {shared && eligible && <div className="mt-5" role="status"><p>{t(copied ? 'boost_copied' : 'boost_confirm_description')}</p><button disabled={busy} onClick={claim} className="mt-4 rounded-full bg-blue-700 text-white px-6 py-3 disabled:opacity-50">{t('boost_confirm')}</button></div>}
    {error && <p role="alert" className="text-red-700 mt-4">{t(error)}</p>}
    {error === 'boost_error' && !status && <button onClick={() => setRetry(value => value + 1)} className="mt-4 underline">{t('boost_retry')}</button>}
    {error === 'boost_profile_required' && <Link className="inline-block mt-4 underline" to="/Onboarding">{t('boost_create_profile')}</Link>}
   </>}
  </section>
  <Link className="inline-block underline mt-6" to="/Discover?view=people">{t('boost_back')}</Link>
 </main>;
}