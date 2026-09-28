import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, ExternalLink, FileUp, FlaskConical, Home, Loader2, Search, Sparkles, Users, X } from 'lucide-react';
import { demoPosts } from './demo';
import { bucketFor, CITIES, normalizePost, sourceUrl, extractPhotos, extractPhones } from '../../../base44/functions/scrapingPilot/logic.js';
import './workspace.css';

const buckets = {rooms:'חדרים מוצעים',leads:'מחפשי חדר / שותפים',review:'דורש בדיקה',excluded:'מחוץ לתוצאות',pending:'ממתין לעיבוד'};
const rentalNames = {regular:'שכירות רגילה',sublet:'סאבלט',regular_with_early_sublet:'חוזה רגיל + סאבלט מוקדם',unknown:'סוג חוזה לא צוין'};
const cityByGroup = {'725098167503643':'חיפה','167457006612972':'באר שבע'};
const bucket = row => row.validationError ? 'review' : row.result ? bucketFor(row.result) : 'pending';
const errorText = e => e?.response?.data?.error || e?.data?.error || e?.message || 'הפעולה לא הושלמה';
const format = n => n == null ? 'לא צוין' : new Intl.NumberFormat('he-IL').format(n);

export default function Workspace({ invoke, openaiReady = false, embedded = false }) {
  const [rows,setRows] = useState(embedded ? [] : demoPosts);
  const [selected,setSelected] = useState(embedded ? null : 'demo-room');
  const [tab,setTab] = useState(embedded ? 'pending' : 'rooms');
  const [query,setQuery] = useState('');
  const [city,setCity] = useState('');
  const [provider,setProvider] = useState('base44');
  const [busy,setBusy] = useState(false);
  const [feedback,setFeedback] = useState('');
  const [importOpen,setImportOpen] = useState(false);
  const [pasted,setPasted] = useState('');
  const [importCity,setImportCity] = useState('');
  const lock = useRef(false);
  const file = useRef(null);
  const current = rows.find(r=>r.id===selected);
  const visible = useMemo(()=>rows.filter(r=>bucket(r)===tab && (!city || (r.result?.city || r.post.groupCity)===city) && (!query || `${r.post.text} ${r.result?.address || ''}`.includes(query))),[rows,tab,city,query]);
  const demo = rows.length > 0 && rows.every(r=>r.post.demo);
  const patch = (id,data) => setRows(old=>old.map(r=>r.id===id?{...r,...data}:r));
  async function action(fn) {
    if(lock.current) return;
    if(!invoke){setFeedback('זו תצוגה מקומית. עיבוד ושמירה זמינים בענף Base44 עם חשבון מנהל.');return;}
    lock.current=true;setBusy(true);setFeedback('הפעולה מתבצעת… עיבוד AI עשוי לקחת עד כדקה.');
    try { await fn(); } catch(e){setFeedback(errorText(e));} finally{lock.current=false;setBusy(false);}
  }
  async function analyze(row) {
    await action(async()=>{
      const data = await invoke({action:'analyze',post:row.post,provider});
      patch(row.id,{result:data.result,validationError:data.validationError || null,model:data.model,provider:data.provider,usage:data.usage,saved:false});
      setTab(data.bucket);setSelected(row.id);setFeedback(data.validationError || 'הפוסט עובד. בדוק את התוצאה מול המקור לפני שמירה.');
    });
  }
  function importText(value) {
    try {
      if(value.length>1000000) throw new Error('הקובץ גדול מדי. בניסוי ניתן לייבא עד 1MB ו־100 פוסטים.');
      const parsed = JSON.parse(value);
      if(!Array.isArray(parsed)||!parsed.length||parsed.length>100) throw new Error('נדרש קובץ JSON של Apify המכיל מערך של 1–100 פוסטים.');
      const seen=new Set();
      const imported=parsed.map(p=>{
        const group=String(p.facebookUrl || p.inputUrl || '').match(/\/groups\/(\d+)/)?.[1];
        const post=normalizePost({...p,groupCity:cityByGroup[group] || importCity,demo:false});
        const key=post.sourceUrl || `${post.groupCity}:${post.text}`;
        if(seen.has(key))return null;seen.add(key);
        return {id:crypto.randomUUID(),post};
      }).filter(Boolean);
      setRows(imported);setSelected(imported[0]?.id);setTab('pending');setCity('');setQuery('');setImportOpen(false);setPasted('');
      setFeedback(`נטענו ${imported.length} פוסטים לזיכרון המסך. הם טרם נשלחו ל־AI וטרם נשמרו.`);
    } catch(e){setFeedback(errorText(e));}
  }
  async function save(row) {
    await action(async()=>{
      await invoke({action:'save',post:row.post,result:row.result});patch(row.id,{saved:true});
      setFeedback(bucket(row)==='leads'?'נשמר ברשימת המחפשים הפרטית. לא נשלחה פנייה.':'נשמר לבדיקה פרטית. לא פורסם באפליקציה.');
    });
  }
  async function loadSaved() {
    await action(async()=>{
      const data=await invoke({action:'list'});
      const imported=data.records.map(r=>({id:r.id,post:normalizePost({text:r.source_text,sourceUrl:r.source_url,groupCity:r.group_city,postedAt:r.posted_at_text,photos:JSON.parse(r.photos_json || '[]'),demo:false}),result:JSON.parse(r.result_json),model:'נשמר לבדיקה על ידי מנהל',saved:true}));
      setRows(imported);setSelected(imported[0]?.id);setTab(imported[0]?bucket(imported[0]):'rooms');setQuery('');setCity('');
      setFeedback(`נטענו ${imported.length} רשומות שמורות (עד 100 האחרונות).`);
    });
  }
  const r=current?.result;
  return <main className={`sp ${embedded ? "sp-embedded" : ""}`} dir="rtl">
    {!embedded && <header className="sp-header"><a className="sp-brand" href="/Discover">ruumr<span>מעבדת מודעות</span></a><span className="sp-private"><FlaskConical size={15}/> סביבת ניסוי · למנהל בלבד</span></header>}
    <section className="sp-intro"><div><div className="sp-eyebrow">{embedded ? "הבית הבא מתחיל כאן" : "מפוסט מבולגן לחדר הבא"}</div><h1>{embedded ? "חדרים בדירות שותפים" : "רואים את מה שחשוב."}</h1><p>הפוסט המקורי, הפרטים שחולצו והמקום הנכון לכל מודעה.</p></div><button className="sp-primary" disabled={busy} onClick={()=>setImportOpen(true)}><FileUp size={18}/> ייבוא פוסטים</button></section>
    <div className="sp-notice">{!rows.length?'ייבא את קובץ הפוסטים מ־Apify כדי לראות את המידע הגולמי.':demo?'דוגמאות מומצאות להמחשה • התיוג המוצג הוכן מראש ולא נוצר בהרצת AI.':'ניסוי על פוסטים מיובאים • לא מוצגים למשתמשי האפליקציה.'} <span>העיבוד אינו משתמש בחשבון הפייסבוק שלך.</span></div>
    <section className="sp-stats" aria-label="סיכום סינון">{['rooms','leads','review','excluded','pending'].map(key=><button key={key} className={tab===key?'active':''} onClick={()=>{setTab(key);setSelected(rows.find(x=>bucket(x)===key)?.id);}}><strong>{rows.filter(x=>bucket(x)===key).length}</strong><span>{buckets[key]}</span></button>)}</section>
    <section className="sp-toolbar"><label className="sp-search"><Search size={17}/><input aria-label="חיפוש בפוסטים" placeholder="חיפוש ברחוב או בטקסט…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="סינון עיר" value={city} onChange={e=>setCity(e.target.value)}><option value="">כל הערים</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select><button disabled={busy} onClick={loadSaved}>רשומות שמורות</button><button disabled={busy} onClick={()=>{setRows(demoPosts);setSelected('demo-room');setTab('rooms');setCity('');setQuery('');}}>דוגמאות</button></section>
    {feedback&&<div role="status" className="sp-feedback">{feedback}</div>}
    <div className="sp-workbench"><aside className="sp-list" aria-label="רשימת פוסטים"><h2>{buckets[tab]} <span>{visible.length}</span></h2>{!visible.length&&<p className="sp-empty">אין פוסטים בתצוגה הזו. אפשר לבחור לשונית אחרת או לייבא פוסטים.</p>}{visible.map(row=><button className={`sp-list-card ${selected===row.id?'selected':''}`} key={row.id} onClick={()=>setSelected(row.id)}><span className="sp-mini-label">{row.post.demo?'דוגמה':row.result?.city || row.post.groupCity || 'עיר לא אומתה'}{row.saved?' · נשמר':''}</span><strong>{row.result?.address || row.result?.rooms?.[0]?.label || row.post.text.slice(0,55) || 'פוסט ללא טקסט'}</strong><p>{row.post.text.slice(0,90)}{row.post.text.length>90?'…':''}</p><span className="sp-list-bottom">{row.result?.rooms?.[0]?.monthlyRentIls!=null?`₪${format(row.result.rooms[0].monthlyRentIls)} / חודש`:row.result?rentalNames[row.result.rentalType]:'ממתין לעיבוד AI'}<ArrowUpRight size={16}/></span></button>)}</aside>
    {current?<section className="sp-detail"><div className="sp-detail-head"><span>השוואת מקור ותוצאה</span><span>{current.post.demo?'דוגמה מומצאת':current.post.postedAt?new Date(current.post.postedAt).toLocaleDateString('he-IL'):'תאריך פרסום לא צוין'}</span></div><div className="sp-columns">
      <article className="sp-source"><h2>הפוסט המקורי</h2><PhotoGallery key={current.id} photos={extractPhotos(current.post)}/><p className="sp-source-text">{current.post.text || 'לא התקבל טקסט. אין להמציא פרטים מתוך פוסט ריק.'}</p>{sourceUrl(current.post.sourceUrl)&&<a className="sp-source-link" href={sourceUrl(current.post.sourceUrl)} target="_blank" rel="noopener noreferrer">פתיחת הפוסט בפייסבוק <ExternalLink size={14}/></a>}</article>
      <article className="sp-result">{current.validationError&&<p role="alert" className="sp-inline-feedback">{current.validationError}</p>}<h2><Sparkles size={18}/> התוצאה המעובדת</h2>{r?<><div className={`sp-category ${bucket(current)}`}>{buckets[bucket(current)]}</div>{bucket(current)==='rooms'&&<><h3>{r.address || r.city}</h3><div className="sp-room-options">{r.rooms.length?r.rooms.map((room,i)=><div key={i}><span>{room.label || 'חדר מוצע'}</span><strong>{room.monthlyRentIls===null?'מחיר לא צוין':`₪${format(room.monthlyRentIls)}`}<small>{room.monthlyRentIls!==null?' לחודש':''}</small></strong></div>):<p>מחיר חדר לא צוין</p>}</div></>}{bucket(current)==='leads'&&<h3><Users size={20}/> מחפש חדר או שותפים</h3>}
      <div className="sp-contact"><strong>טלפון מתוך הפוסט</strong><p dir="ltr">{extractPhones(current.post.text).join(" · ") || "לא נמצא מספר בפורמט תקין"}</p>{bucket(current)==='rooms'&&<p>{!extractPhotos(current.post).length || !extractPhones(current.post.text).length ? "לא מתאים לפרסום: נדרשים גם תמונות וגם מספר טלפון בפוסט." : "יש קישורי תמונות וטלפון; עדיין נדרשת בדיקה ידנית לפני פרסום."}</p>}</div><div className="sp-tags"><span>{r.city==='unknown'?'עיר לא ידועה':r.city==='outside'?'מחוץ לערים שנבחרו':r.city}</span>{r.cityBasis==='group_context'&&<span>העיר לפי הקבוצה בלבד</span>}<span>{rentalNames[r.rentalType]}</span>{r.shabbatPolicy!=='unknown'&&<span>{r.shabbatPolicy==='observant'?'דירה שומרת שבת':'דירה שאינה שומרת שבת'}</span>}{r.kosherPolicy!=='unknown'&&<span>{r.kosherPolicy==='kosher'?'מטבח כשר':'מטבח לא כשר'}</span>}</div>
      <dl className="sp-facts">{[['כניסה',r.entryText],['סיום / יציאה',r.endText],['שותפים קיימים',r.existingRoommates],['דיירים בסך הכול',r.totalOccupants],['ריהוט',r.furnitureText],['חשבונות ותוספות',r.billsText]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value===''||value==null?'לא צוין':value}</dd></div>)}</dl>{r.freeText&&<p className="sp-free">{r.freeText}</p>}<p className="sp-reason">{r.reason}</p>{r.warnings.length>0&&<ul className="sp-warnings">{r.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>}{r.evidence.length>0&&<details><summary>על מה מבוסס החילוץ?</summary>{r.evidence.map((e,i)=><blockquote key={i}>{e.quote}</blockquote>)}</details>}<p className="sp-model">{current.model || 'לא צוין מודל'}{current.usage?.total_tokens?` · ${current.usage.total_tokens} טוקנים`:''}</p>
      </>:<div className="sp-unprocessed"><Home size={38}/><h3>כאן יופיע הכרטיס</h3><p>לחץ על עיבוד הפוסט כדי לחלץ פרטים ולסווג אותו.</p></div>}</article>
    </div><footer className="sp-actions" aria-busy={busy}><div><label>שירות העיבוד<select aria-label="שירות העיבוד" disabled={busy} value={provider} onChange={e=>setProvider(e.target.value)}><option value="base44">AI מובנה ב־Base44</option><option value="openai" disabled={!openaiReady}>GPT-5.4 mini{!openaiReady?' — נדרש חיבור':''}</option></select></label><small>{provider==='base44'?'משתמש בקרדיטי האינטגרציה של Base44; המודל מנוהל על ידם.':'מחויב בנפרד בחשבון OpenAI. מפתח נשמר בשרת בלבד.'}</small></div><div className="sp-action-buttons"><button className="sp-primary" disabled={busy || !current.post.text} onClick={()=>analyze(current)}>{busy?<Loader2 size={17} className="sp-spin"/>:<Sparkles size={17}/>} {busy?'מעבד…':r?'עיבוד מחדש':'עיבוד הפוסט'}</button>{r&&['rooms','leads'].includes(bucket(current))&&<button disabled={busy||current.post.demo||!current.post.sourceUrl||current.saved} onClick={()=>save(current)}><Check size={16}/>{current.saved?'נשמר':bucket(current)==='leads'?'שמירת מחפש להמשך':'שמירה לבדיקה'}</button>}</div>{feedback&&<div role="status" aria-live="polite" className="sp-inline-feedback">{feedback}</div>}</footer>{!current.post.text&&<p className="sp-inline-feedback">הכפתור אינו פעיל כי הפוסט התקבל ללא טקסט. התמונות לבדן אינן מעובדות בשלב הזה.</p>}<p className="sp-footnote">השמירה היא לרשימה פרטית בלבד. פתיחת פוסט היא גלישה רגילה בפייסבוק; אין כאן שליחת הודעות אוטומטית. פוסטים שלא נשמרו ייעלמו ברענון או בהחלפת המדגם.</p></section>:<div className="sp-detail sp-empty">בחר פוסט או ייבא מדגם כדי להתחיל.</div>}</div>
    {importOpen&&<div className="sp-modal-backdrop"><section className="sp-modal" role="dialog" aria-modal="true" aria-labelledby="sp-import-title"><button className="sp-close" aria-label="סגירה" onClick={()=>setImportOpen(false)}><X size={20}/></button><h2 id="sp-import-title">מביאים את הפוסטים פנימה</h2><p>העלה JSON שייצאת מ־Apify, או הדבק את תוכנו. הייבוא למסך אינו מפעיל סקרייפינג או AI.</p><label>עיר הקבוצה (רק אם לא זוהתה)<select value={importCity} onChange={e=>setImportCity(e.target.value)}><option value="">לא ידוע</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label><input ref={file} type="file" accept=".json,application/json" aria-label="קובץ פוסטים מ־Apify" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1000000){setFeedback('הקובץ גדול מ־1MB');return;}importText(await f.text());e.target.value='';}}/><textarea aria-label="נתוני JSON של הפוסטים" placeholder='[{"text":"תוכן הפוסט", "url":"קישור לפוסט"}]' value={pasted} onChange={e=>setPasted(e.target.value)}/><button className="sp-primary" disabled={!pasted.trim()} onClick={()=>importText(pasted)}>טעינת הפוסטים</button>{feedback&&<p role="status">{feedback}</p>}</section></div>}
  </main>;
}

function PhotoGallery({photos}) {
  const [failed,setFailed]=useState([]);
  if(!photos.length)return <p className="sp-media-note">לא התקבלו תמונות לפוסט. מודעת חדר ללא תמונות לא מתאימה לפרסום.</p>;
  return <section aria-label="תמונות מהפוסט"><div className="sp-photos">{photos.map((url,i)=><div key={url}>{failed.includes(url)?<p>תמונה {i+1} לא נטענה</p>:<img src={url} alt={'תמונה '+(i+1)+' מהפוסט — טעונה בדיקה'} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(old=>[...old,url])}/>}</div>)}</div><p className="sp-media-note">{photos.length} תמונות מהמקור. הקישורים זמניים; התמונות עדיין לא הועתקו לאחסון קבוע.{failed.length>0?' חלק מהתמונות אינן זמינות. יש לייבא מדגם מעודכן לפני פרסום.':''}</p></section>;
}
