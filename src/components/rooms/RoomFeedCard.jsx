import React,{useState} from 'react';
import {MapPin,CalendarDays} from 'lucide-react';
import SaveRoomButton from './SaveRoomButton';
import ShareRoomButton from './ShareRoomButton';
import RoomContactActions from './RoomContactActions';
import RoomGallery from './RoomGallery';
import {roomText as rt,useRoomLocale,roomLocale,roomDate} from '@/lib/room-i18n';
export default function RoomFeedCard({room:r,saved=false,footer}){
 useRoomLocale();const [bad,setBad]=useState({});
 const posted=r.source_posted_at||(r.source_kind==='facebook'?'':r.created_date);
 return <article className="rr-card rf-card">
 <RoomGallery photos={r.photos||[]} failed={bad} onFail={(url)=>setBad(x=>({...x,[url]:true}))}/>
 <div className="rf-content"><div className="rf-heading"><div><p className="rf-city"><MapPin size={15}/>{rt(r.city)}</p><h2>{r.title}</h2></div><strong className="rf-price">{Number.isFinite(r.price)?<>{r.price_options?.length>1&&rt('feed.from')}₪{r.price.toLocaleString(roomLocale())}<small>{rt(' לחודש')}</small></>:rt('feed.price_unknown')}</strong></div>
 {r.publisher_name&&<div className="rh-publisher">{r.publisher_photo&&<img className="rh-avatar" src={r.publisher_photo} alt={r.publisher_name}/>}<span>{r.publisher_name} · {rt(r.publisher_type==='departing'?'hub.departing':'hub.owner')}</span></div>}
 {posted&&<p className="rf-date"><CalendarDays size={14}/>{rt('feed.posted',{date:roomDate(posted)})}</p>}
 <div className="rf-tags">{r.rental_type&&r.rental_type!=='unknown'&&<span>{rt('feed.'+r.rental_type)}</span>}{(r.entry_text||r.entry_date)&&<span className="rf-entry">{rt('feed.entry',{value:r.entry_text||roomDate(r.entry_date)})}</span>}{(r.end_text||r.end_date)&&<span>{rt('feed.end',{value:r.end_text||roomDate(r.end_date)})}</span>}{Number.isInteger(r.roommates)&&<span>{rt('feed.roommates',{count:r.roommates})}</span>}{r.furniture&&<span>{r.furniture}</span>}{r.shabbat_policy==='observant'&&<span>{rt('feed.shabbat')}</span>}{r.kosher_policy==='kosher'&&<span>{rt('feed.kosher')}</span>}</div>
 {(r.description||r.bills_text||r.price_options?.length>1)&&<details className="rf-details"><summary>{rt('feed.more')}</summary>{r.price_options?.length>1&&<ul>{r.price_options.map((x,i)=><li key={i}>{x.label} · ₪{x.amount.toLocaleString(roomLocale())}</li>)}</ul>}<p className="rr-description">{r.description}</p>{r.bills_text&&<p>{rt('feed.bills')}: {r.bills_text}</p>}</details>}
 <div className="rf-actions"><RoomContactActions room={r}/><SaveRoomButton roomId={r.id} initialSaved={saved}/><ShareRoomButton room={r}/></div>
 {footer}</div></article>;
}
