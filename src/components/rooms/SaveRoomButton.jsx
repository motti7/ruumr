import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {Bookmark} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {roomHub} from '@/api/roomHub';
import {roomText as rt,useRoomLocale} from '@/lib/room-i18n';
export default function SaveRoomButton({roomId,initialSaved=false,onChange}){
 useRoomLocale();const {isAuthenticated,hasProfile}=useAuth();const [saved,setSaved]=useState(initialSaved),[busy,setBusy]=useState(false),[prompt,setPrompt]=useState(false),[error,setError]=useState(false);
 async function toggle(){if(!isAuthenticated||!hasProfile){setPrompt(true);return;}setBusy(true);setError(false);try{await roomHub('save',{room_id:roomId,saved:!saved});setSaved(!saved);onChange?.(!saved);}catch{setError(true);}finally{setBusy(false);}}
 return <><button disabled={busy} aria-pressed={saved} onClick={toggle} className="rr-add"><Bookmark size={18} fill={saved?'currentColor':'none'}/>{rt(saved?'hub.saved':'hub.save_room')}</button>{prompt&&<div role="dialog" aria-label={rt('hub.save_room')} className="rr-card"><p>{rt('hub.save_requires_partner')}</p><Link className="rr-add" to={isAuthenticated?'/Onboarding':'/register?next=Partner'}>{rt(isAuthenticated?'hub.complete_partner':'hub.create_partner')}</Link>{!isAuthenticated&&<Link to="/login?next=Partner">{rt('hub.sign_in')}</Link>}<button onClick={()=>setPrompt(false)}>{rt('hub.cancel')}</button></div>}{error&&<p role="alert">{rt('hub.failed')}</p>}</>;
}
