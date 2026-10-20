import {roomHub} from '@/api/roomHub';
import {useSearchParams,Link} from 'react-router-dom';
import {roomText as rt,roomDirection,useRoomLocale} from '@/lib/room-i18n';
import React,{useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import RoomFeedCard from './RoomFeedCard';

import './rooms.css';
export async function roomRequest(body){const response=await base44.functions.invoke('roomListings',body);if(response.data?.error)throw new Error(response.data.error);return response.data;}
export default function RoomListings(){
 useRoomLocale();const {isAuthenticated,hasProfile}=useAuth();const [params]=useSearchParams();
 const [savedIds,setSavedIds]=useState(new Set()),[shareLink,setShareLink]=useState(''),[revision,setRevision]=useState(0);
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[closing,setClosing]=useState(null);
 const roomId=params.get('room');
 useEffect(()=>{if(hasProfile)roomHub('saved').then(x=>setSavedIds(new Set(x.records.map(r=>r.id)))).catch(()=>{});else setSavedIds(new Set());},[hasProfile]);
 useEffect(()=>{let active=true;setLoading(true);setError('');roomRequest({action:'list',room_id:roomId||undefined}).then(data=>{if(active)setRows(data.records);}).catch(()=>{if(active)setError('לא הצלחנו לטעון את החדרים. נסה לרענן את המסך.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[roomId,revision]);
 async function share(r){const url=new URL('/Rooms?room='+encodeURIComponent(r.id),window.location.origin).toString();try{if(navigator.share)await navigator.share({title:r.title,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);setShareLink(url);}else setShareLink(url);}catch(e){if(e.name!=='AbortError')setShareLink(url);}}
 async function close(id){setClosing(id);setError('');try{await roomRequest({action:'close',id});setRows(old=>old.filter(r=>r.id!==id));}catch{setError('הסרת המודעה מהתצוגה נכשלה. נסה שוב.');}finally{setClosing(null);}}
 return <section className="rr rf-feed" dir={roomDirection()}><header className="rf-intro"><h1>{rt('חדרים בדירות שותפים')}</h1><Link className="rr-add" to={isAuthenticated?'/AddRoom':'/register?next=AddRoom'}>{rt('hub.list_room')}</Link></header>

 {shareLink&&<p role="status">{rt('hub.share_link')} <a href={shareLink}>{shareLink}</a></p>}{loading&&<p role="status">{rt('טוען חדרים…')}</p>}{error&&<p role="alert">{rt(error)} <button onClick={()=>setRevision(x=>x+1)}>{rt('feed.retry_load')}</button></p>}{!loading&&!error&&!rows.length&&<p>{rt('עדיין אין חדרים שפורסמו כאן. אפשר להוסיף את החדר הראשון.')}</p>}
 <div className="rf-list">{[...rows].sort((a,b)=>String(b.source_posted_at||b.created_date||'').localeCompare(String(a.source_posted_at||a.created_date||''))).map(r=><RoomFeedCard key={r.id+savedIds.has(r.id)} room={r} saved={savedIds.has(r.id)} onShare={share} footer={r.is_owner&&<button disabled={closing!==null} onClick={()=>close(r.id)}>{rt(closing===r.id?'מסיר…':'החדר הושכר — הסרה מהתצוגה')}</button>}/>)}</div></section>;
}