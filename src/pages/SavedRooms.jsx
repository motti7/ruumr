import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {roomHub} from '@/api/roomHub';
import {useAuth} from '@/lib/AuthContext';
import {roomText as rt,roomDirection,useRoomLocale} from '@/lib/room-i18n';
export default function SavedRooms(){useRoomLocale();const {hasProfile}=useAuth();const [records,setRecords]=useState(null),[error,setError]=useState(false);
 useEffect(()=>{if(hasProfile)roomHub('saved').then(x=>setRecords(x.records)).catch(()=>setError(true));},[hasProfile]);
 async function remove(id){try{await roomHub('save',{room_id:id,saved:false});setRecords(x=>x.filter(r=>r.id!==id));}catch{setError(true);}}
 return <section className="rr" dir={roomDirection()}><h1>{rt('hub.saved_rooms')}</h1>{!hasProfile?<><p>{rt('hub.save_requires_partner')}</p><Link to="/Onboarding">{rt('hub.complete_partner')}</Link></>:<>{!records&&!error&&<p role="status">{rt('hub.loading')}</p>}{records?.length===0&&<p>{rt('hub.no_saved')}</p>}{records?.map(r=><article key={r.id} className="rr-card">{r.photos?.[0]&&<img className="rh-room-photo" src={r.photos[0]} alt={r.title}/>}<h2>{r.title}</h2><p>{rt(r.city)} · ₪{r.price}</p>{r.status==='published'?<Link to={'/Rooms?room='+encodeURIComponent(r.id)}>{rt('hub.view_room')}</Link>:<p>{rt('hub.closed')}</p>}<button onClick={()=>remove(r.id)}>{rt('hub.unsave')}</button></article>)}</>}{error&&<p role="alert">{rt('hub.failed')}</p>}</section>;
}
