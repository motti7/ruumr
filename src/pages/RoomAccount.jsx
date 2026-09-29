import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {roomHub} from '@/api/roomHub';
import {roomRequest} from '@/components/rooms/RoomListings';
import {roomText as rt,roomDirection,useRoomLocale} from '@/lib/room-i18n';
import '@/components/rooms/rooms.css';
export default function RoomAccount(){
 useRoomLocale();const [params]=useSearchParams();
 const [data,setData]=useState(null),[publisher,setPublisher]=useState({display_name:'',photo:'',publisher_type:'owner'}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const load=()=>roomHub('account').then(x=>{setData(x);if(x.publisher)setPublisher(x.publisher);});
 useEffect(()=>{load().catch(()=>setError('hub.failed'));},[]);
 async function action(fn){setBusy(true);setError('');try{await fn();}catch(e){setError(e.response?.data?.error||e.message||'hub.failed');}finally{setBusy(false);}}
 async function photo(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){setError('hub.photo_error');return;}await action(async()=>{const result=await base44.integrations.Core.UploadFile({file});setPublisher(p=>({...p,photo:result.file_url}));});}
 return <section className="rr" dir={roomDirection()}><h1>{rt('hub.publisher_account')}</h1><p>{rt('hub.publisher_intro')}</p>{data?.has_profile&&<Link to="/Profile">{rt('hub.partner_account')}</Link>}
 <form onSubmit={e=>{e.preventDefault();action(async()=>{await roomHub('publisher',publisher);setSaved(true);await load();});}}><fieldset disabled={busy}>
 <label>{rt('hub.display_name')}<input required maxLength={80} value={publisher.display_name} onChange={e=>{setSaved(false);setPublisher(p=>({...p,display_name:e.target.value}));}}/></label>
 <label>{rt('hub.publisher_type')}<select value={publisher.publisher_type} onChange={e=>{setSaved(false);setPublisher(p=>({...p,publisher_type:e.target.value}));}}><option value="owner">{rt('hub.owner')}</option><option value="departing">{rt('hub.departing')}</option></select></label>
 <label>{rt('hub.optional_photo')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo}/></label>{publisher.photo&&<><img className="rh-avatar" src={publisher.photo} alt={rt('hub.publisher_photo')}/><button type="button" onClick={()=>setPublisher(p=>({...p,photo:''}))}>{rt('hub.remove_photo')}</button></>}
 <button className="rr-primary" type="submit">{rt('hub.save_publisher')}</button></fieldset></form>
 {saved&&<p role="status">{rt('hub.publisher_saved')}</p>}{error&&<p role="alert">{rt(error)}</p>}
 {data?.publisher&&<><Link className="rr-add" to="/AddRoom">{rt(params.get('next')==='AddRoom'?'hub.continue_room':'hub.add_another')}</Link><Link className="rr-add" to="/Discover?view=people&mode=publisher">{rt('hub.find_tenants')}</Link></>}
 <h2>{rt('hub.my_rooms')}</h2>{data?.rooms.map(r=><article className="rr-card" key={r.id}><h3>{r.title}</h3><p>{rt(r.status==='published'?'hub.active':'hub.closed')}</p>{r.status==='published'&&<><Link className="rr-add" to={'/AddRoom?edit='+encodeURIComponent(r.id)}>{rt('hub.edit_room')}</Link><button disabled={busy} onClick={()=>action(async()=>{await roomRequest({action:'close',id:r.id});await load();})}>{rt('hub.close_room')}</button></>}</article>)}
 <p>{rt('hub.account_remains')}</p><Link to="/Settings">{rt('hub.settings')}</Link></section>;
}
