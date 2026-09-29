import SaveRoomButton from './SaveRoomButton';
import {roomHub} from '@/api/roomHub';
import {useSearchParams} from 'react-router-dom';
import {roomText as rt, roomDirection, useRoomLocale, roomLocale, roomDate} from '@/lib/room-i18n';
import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import './rooms.css';
import {useAuth} from '@/lib/AuthContext';
export async function roomRequest(body){const response=await base44.functions.invoke('roomListings',body);if(response.data?.error)throw new Error(response.data.error);return response.data;}
export default function RoomListings(){
  useRoomLocale();
  const {isAuthenticated,hasProfile}=useAuth();
  const [params]=useSearchParams();const [savedIds,setSavedIds]=useState(new Set());
  const [shareLink,setShareLink]=useState('');
  useEffect(()=>{if(hasProfile)roomHub('saved').then(x=>setSavedIds(new Set(x.records.map(r=>r.id)))).catch(()=>{});},[hasProfile]);
  async function share(r){const url=new URL('/Rooms?room='+encodeURIComponent(r.id),'https://app.ruumrapp.com').toString();try{if(navigator.share)await navigator.share({title:r.title,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);setShareLink(url);}else setShareLink(url);}catch(e){if(e.name!=='AbortError')setShareLink(url);}}

  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[closing,setClosing]=useState(null);
  useEffect(()=>{let active=true;setLoading(true);setError('');roomRequest({action:'list',room_id:params.get('room')||undefined}).then(data=>{if(active)setRows(data.records);}).catch(()=>{if(active)setError(rt("לא הצלחנו לטעון את החדרים. נסה לרענן את המסך."));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[params]);
  async function close(id){setClosing(id);setError('');try{await roomRequest({action:'close',id});setRows(old=>old.filter(r=>r.id!==id));}catch{setError(rt("הסרת המודעה מהתצוגה נכשלה. נסה שוב."));}finally{setClosing(null);}}
  return <section className="rr" dir={roomDirection()}><h1>{rt("חדרים בדירות שותפים")}</h1><p>{rt("חדרים שפורסמו ישירות באפליקציה")}</p><Link className="rr-add" to={isAuthenticated?"/AddRoom":"/register?next=AddRoom"}>{rt('hub.list_room')}</Link>{shareLink&&<p role="status">{rt("hub.share_link")} <a href={shareLink}>{shareLink}</a></p>}{loading&&<p role="status">{rt("טוען חדרים…")}</p>}{error&&<p role="alert">{rt(error)}</p>}{!loading&&!error&&!rows.length&&<p>{rt("עדיין אין חדרים שפורסמו כאן. אפשר להוסיף את החדר הראשון.")}</p>}
    <div className="rr-cards">{[...rows].sort((a,b)=>Number(b.id===params.get("room"))-Number(a.id===params.get("room"))).map(r=><article key={r.id} className="rr-card"><div className="rr-gallery">{r.photos.map((url,i)=><img key={url} src={url} alt={r.title+rt(" — תמונה ")+(i+1)} loading="lazy"/>)}</div><h2>{r.title}</h2>{r.publisher_name&&<div className="rh-publisher">{r.publisher_photo&&<img className="rh-avatar" src={r.publisher_photo} alt={r.publisher_name}/>}<span>{r.publisher_name} · {rt(r.publisher_type==='departing'?'hub.departing':'hub.owner')}</span></div>}<SaveRoomButton key={r.id+savedIds.has(r.id)} roomId={r.id} initialSaved={savedIds.has(r.id)}/><button className="rr-add" onClick={()=>share(r)}>{rt('hub.share')}</button><p>{rt(r.city)} · {r.address}</p><strong>₪{r.price.toLocaleString(roomLocale())}{rt(" לחודש")}</strong><p>{r.rental_type==='sublet'?rt("סאבלט"):rt("שכירות רגילה")}{rt(" · כניסה ")}{roomDate(r.entry_date)}{r.end_date?rt(" · עד ")+roomDate(r.end_date):''}</p><p>{r.roommates}{rt(" שותפים קיימים")}{r.furniture?' · '+r.furniture:''}</p><p className="rr-description">{r.description}</p><a href={'tel:'+r.phone} className="rr-add">{rt("ליצירת קשר: ")}<bdi>{r.phone}</bdi></a>{r.is_owner&&<button disabled={closing!==null} onClick={()=>close(r.id)}>{closing===r.id?rt("מסיר…"):rt("החדר הושכר — הסרה מהתצוגה")}</button>}</article>)}</div>
  </section>;
}
