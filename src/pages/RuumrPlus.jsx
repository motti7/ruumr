import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Rocket, Share2, CheckCircle2, Home, Heart, Clock3 } from 'lucide-react';
import { profileBoosts } from '@/api/profileBoosts';
import '@/styles/share-boost.css';
const SHARE_URL = 'https://app.ruumrapp.com';
export default function RuumrPlus() {
 const { t, i18n } = useTranslation();
 const [status,setStatus]=useState(null),[loading,setLoading]=useState(true),[claiming,setClaiming]=useState(false),[sharing,setSharing]=useState(false);
 const [error,setError]=useState(null),[shareMessage,setShareMessage]=useState(null),[manual,setManual]=useState(false),[now,setNow]=useState(Date.now()),[retry,setRetry]=useState(0);
 const claimLock=useRef(false),shareLock=useRef(false);
 useEffect(()=>{let mounted=true;setLoading(true);setError(null);
 profileBoosts('status').then(x=>{if(mounted)setStatus(x);}).catch(e=>{if(mounted)setError(e?.response?.data?.error==='profile_required'||e.code==='profile_required'?'boost_profile_required':'boost_error');}).finally(()=>{if(mounted)setLoading(false);});
 const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{mounted=false;clearInterval(timer);};},[retry]);
 const active=status?.expiresAt&&Date.parse(status.expiresAt)>now;
 const eligible=status&&(!status.nextEligibleAt||Date.parse(status.nextEligibleAt)<=now);
 const date=value=>new Intl.DateTimeFormat(i18n.language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 async function share(){if(shareLock.current)return;shareLock.current=true;setSharing(true);setShareMessage(null);setManual(false);
 const payload={title:'RUUMR',text:t('boost_share_text'),url:SHARE_URL};
 try{if(navigator.share&&(!navigator.canShare||navigator.canShare(payload))){try{await navigator.share(payload);setShareMessage('boost_share_done');return;}catch(e){if(e.name==='AbortError')return;}}
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(`${payload.text} ${SHARE_URL}`);setShareMessage('boost_copied');}else setManual(true);
 }catch{setManual(true);}finally{shareLock.current=false;setSharing(false);}}
 async function claim(){if(claimLock.current)return;claimLock.current=true;setClaiming(true);setError(null);try{setStatus(await profileBoosts('claim'));setNow(Date.now());}catch{setError('boost_error');}finally{claimLock.current=false;setClaiming(false);}}
 return <main dir={i18n.dir()} className="share-boost-page">
 <section className="sb-share" aria-labelledby="sb-share-title"><p className="sb-eyebrow">{t('boost_share_eyebrow')}</p>
 <div className="sb-art" aria-hidden="true"><span><Home/></span><span><Heart/></span><span><ArrowUpRight/></span><i/></div>
 <h1 id="sb-share-title">{t('boost_share_title')}</h1><p className="sb-description">{t('boost_share_description')}</p>
 <button className="sb-share-button" disabled={sharing} onClick={share}><Share2 size={20} aria-hidden="true"/>{t(sharing?'boost_working':'boost_share')}<ArrowUpRight size={20} aria-hidden="true"/></button>
 {shareMessage&&<p className="sb-feedback" role="status">{t(shareMessage)}</p>}
 {manual&&<div className="sb-feedback" role="status"><label htmlFor="sb-share-url">{t('boost_share_manual')}</label><input id="sb-share-url" aria-label={t('boost_link_label')} readOnly dir="ltr" value={SHARE_URL} onFocus={e=>e.target.select()}/></div>}
 </section>
 <section className="sb-boost" aria-labelledby="sb-boost-title" aria-busy={loading||claiming}><div className="sb-boost-top"><p className="sb-eyebrow">{t('boost_kicker')}</p><Rocket aria-hidden="true"/></div>
 <h2 id="sb-boost-title">{t('boost_title')}</h2><p className="sb-description">{t('boost_description')}</p>
 <div className="sb-perks"><span><Clock3 size={16} aria-hidden="true"/>{t('boost_duration')}</span><span>{t('boost_frequency')}</span></div>
 {loading?<p role="status">{t('loading')}</p>:<>
 {active&&<div className="sb-active" role="status"><CheckCircle2 aria-hidden="true"/><div><strong>{t('boost_active')}</strong><p>{t('boost_until',{date:date(status.expiresAt)})}</p></div></div>}
 {!eligible&&status?.nextEligibleAt&&<p className="sb-next">{t('boost_next',{date:date(status.nextEligibleAt)})}</p>}
 {eligible&&<button className="sb-claim-button" disabled={claiming} onClick={claim}><Rocket size={20} aria-hidden="true"/>{t(claiming?'boost_working':'boost_confirm')}</button>}
 {error&&<p role="alert" className="sb-error">{t(error)}</p>}
 {error==='boost_error'&&!status&&<button className="sb-retry" onClick={()=>setRetry(v=>v+1)}>{t('boost_retry')}</button>}
 {error==='boost_profile_required'&&<Link to="/Onboarding">{t('boost_create_profile')}</Link>}
 </>}
 <p className="sb-independent">{t('boost_independent')}</p></section>
 <Link className="sb-back" to="/Discover?view=people">{t('boost_back')}</Link></main>;
}
