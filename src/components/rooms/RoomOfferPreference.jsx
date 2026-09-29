import React,{useEffect,useState} from 'react';
import {roomHub} from '@/api/roomHub';
import {roomText as rt,useRoomLocale} from '@/lib/room-i18n';
export default function RoomOfferPreference(){useRoomLocale();const [value,setValue]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{roomHub('account').then(x=>{if(x.has_profile)setValue(x.accept_offers);}).catch(()=>setError(true));},[]);
 if(value===null)return error?<p role="alert">{rt('hub.failed')}</p>:null;
 return <div className="rr-card"><label className="rr-confirm"><input type="checkbox" checked={value} disabled={busy} onChange={async e=>{const next=e.target.checked;setBusy(true);setError(false);try{await roomHub('preference',{accept_offers:next});setValue(next);}catch{setError(true);}finally{setBusy(false);}}}/>{rt('hub.accept_offers')}</label>{error&&<p role="alert">{rt('hub.failed')}</p>}<a href="/RoomAccount">{rt('hub.manage_publisher')}</a></div>;
}
