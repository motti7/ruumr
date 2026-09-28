import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import './rooms.css';
import {useAuth} from '@/lib/AuthContext';
export async function roomRequest(body){const response=await base44.functions.invoke('roomListings',body);if(response.data?.error)throw new Error(response.data.error);return response.data;}
export default function RoomListings(){
  const {isAuthenticated}=useAuth();
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[closing,setClosing]=useState(null);
  useEffect(()=>{let active=true;roomRequest({action:'list'}).then(data=>{if(active)setRows(data.records);}).catch(()=>{if(active)setError('לא הצלחנו לטעון את החדרים. נסה לרענן את המסך.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  async function close(id){setClosing(id);setError('');try{await roomRequest({action:'close',id});setRows(old=>old.filter(r=>r.id!==id));}catch{setError('הסרת המודעה מהתצוגה נכשלה. נסה שוב.');}finally{setClosing(null);}}
  return <section className="rr" dir="rtl"><h1>חדרים בדירות שותפים</h1><p>חדרים שפורסמו ישירות באפליקציה</p><Link className="rr-add" to={isAuthenticated?"/AddRoom":"/register?next=AddRoom"}>+ פרסום חדר לבעלי דירות</Link>{loading&&<p role="status">טוען חדרים…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&!rows.length&&<p>עדיין אין חדרים שפורסמו כאן. אפשר להוסיף את החדר הראשון.</p>}
    <div className="rr-cards">{rows.map(r=><article key={r.id} className="rr-card"><div className="rr-gallery">{r.photos.map((url,i)=><img key={url} src={url} alt={r.title+' — תמונה '+(i+1)} loading="lazy"/>)}</div><h2>{r.title}</h2><p>{r.city} · {r.address}</p><strong>₪{r.price.toLocaleString('he-IL')} לחודש</strong><p>{r.rental_type==='sublet'?'סאבלט':'שכירות רגילה'} · כניסה {r.entry_date}{r.end_date?' · עד '+r.end_date:''}</p><p>{r.roommates} שותפים קיימים{r.furniture?' · '+r.furniture:''}</p><p className="rr-description">{r.description}</p><a href={'tel:'+r.phone} className="rr-add">ליצירת קשר: <bdi>{r.phone}</bdi></a>{r.is_owner&&<button disabled={closing!==null} onClick={()=>close(r.id)}>{closing===r.id?'מסיר…':'החדר הושכר — הסרה מהתצוגה'}</button>}</article>)}</div>
  </section>;
}
