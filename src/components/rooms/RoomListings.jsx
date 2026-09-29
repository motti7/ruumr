import {roomText as rt, roomDirection, useRoomLocale, roomLocale, roomDate} from '@/lib/room-i18n';
import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import './rooms.css';
import {useAuth} from '@/lib/AuthContext';
export async function roomRequest(body){const response=await base44.functions.invoke('roomListings',body);if(response.data?.error)throw new Error(response.data.error);return response.data;}
export default function RoomListings(){
  useRoomLocale();
  const {isAuthenticated}=useAuth();
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[closing,setClosing]=useState(null);
  useEffect(()=>{let active=true;roomRequest({action:'list'}).then(data=>{if(active)setRows(data.records);}).catch(()=>{if(active)setError(rt("לא הצלחנו לטעון את החדרים. נסה לרענן את המסך."));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  async function close(id){setClosing(id);setError('');try{await roomRequest({action:'close',id});setRows(old=>old.filter(r=>r.id!==id));}catch{setError(rt("הסרת המודעה מהתצוגה נכשלה. נסה שוב."));}finally{setClosing(null);}}
  return <section className="rr" dir={roomDirection()}><h1>{rt("חדרים בדירות שותפים")}</h1><p>{rt("חדרים שפורסמו ישירות באפליקציה")}</p><Link className="rr-add" to={isAuthenticated?"/AddRoom":"/register?next=AddRoom"}>{rt("+ פרסום חדר לבעלי דירות")}</Link>{loading&&<p role="status">{rt("טוען חדרים…")}</p>}{error&&<p role="alert">{rt(error)}</p>}{!loading&&!error&&!rows.length&&<p>{rt("עדיין אין חדרים שפורסמו כאן. אפשר להוסיף את החדר הראשון.")}</p>}
    <div className="rr-cards">{rows.map(r=><article key={r.id} className="rr-card"><div className="rr-gallery">{r.photos.map((url,i)=><img key={url} src={url} alt={r.title+rt(" — תמונה ")+(i+1)} loading="lazy"/>)}</div><h2>{r.title}</h2><p>{rt(r.city)} · {r.address}</p><strong>₪{r.price.toLocaleString(roomLocale())}{rt(" לחודש")}</strong><p>{r.rental_type==='sublet'?rt("סאבלט"):rt("שכירות רגילה")}{rt(" · כניסה ")}{roomDate(r.entry_date)}{r.end_date?rt(" · עד ")+roomDate(r.end_date):''}</p><p>{r.roommates}{rt(" שותפים קיימים")}{r.furniture?' · '+r.furniture:''}</p><p className="rr-description">{r.description}</p><a href={'tel:'+r.phone} className="rr-add">{rt("ליצירת קשר: ")}<bdi>{r.phone}</bdi></a>{r.is_owner&&<button disabled={closing!==null} onClick={()=>close(r.id)}>{closing===r.id?rt("מסיר…"):rt("החדר הושכר — הסרה מהתצוגה")}</button>}</article>)}</div>
  </section>;
}
