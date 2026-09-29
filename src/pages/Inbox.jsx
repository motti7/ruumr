import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import Matches from './Matches';
import LikesYou from './LikesYou';
import {useAuth} from '@/lib/AuthContext';
import {roomHub} from '@/api/roomHub';
import {roomText as rt,roomDirection,useRoomLocale} from '@/lib/room-i18n';
export default function Inbox(){useRoomLocale();const {hasProfile,user}=useAuth();const [params,setParams]=useSearchParams();const tab=params.get('tab')||'chats';const [filter,setFilter]=useState('all'),[offers,setOffers]=useState([]),[error,setError]=useState(false);
 useEffect(()=>{let active=true;const load=()=>roomHub('inbox').then(x=>{if(active){setOffers(x.records);setError(false);}}).catch(()=>{if(active)setError(true);});load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer);};},[]);
 const unread=offers.filter(o=>user?.id===o.owner_id?!o.owner_read:!o.recipient_read).length;
 return <div dir={roomDirection()}><div className="rh-tabs" role="tablist" aria-label={rt('hub.messages')}><button role="tab" aria-selected={tab==='chats'} onClick={()=>setParams({tab:'chats'})}>{rt('hub.chats')}{unread>0?' · '+unread:''}</button>{hasProfile&&<button role="tab" aria-selected={tab==='likes'} onClick={()=>setParams({tab:'likes'})}>{rt('hub.likes')}</button>}</div>
 {tab==='likes'&&hasProfile?<LikesYou/>:<><div className="rh-tabs">{(hasProfile?['all','partners','offers']:['offers']).map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{rt('hub.'+k)}</button>)}</div>{filter!=='partners'&&<section className="rr"><h2>{rt('hub.offers')}</h2>{error&&<p role="alert">{rt('hub.failed')}</p>}{offers.length===0&&<p>{rt('hub.no_offers')}</p>}{offers.map(o=><Link className="rr-card rh-offer-row" key={o.id} to={'/RoomChat?offerId='+encodeURIComponent(o.id)}><strong>{user?.id===o.owner_id?o.recipient_name:o.publisher_snapshot?.display_name}</strong><span>{o.room_snapshot?.title}</span>{(user?.id===o.owner_id?!o.owner_read:!o.recipient_read)&&<span>{rt('hub.new')}</span>}</Link>)}</section>}{hasProfile&&filter!=='offers'&&<Matches embedded/>}</>}
 </div>;
}
