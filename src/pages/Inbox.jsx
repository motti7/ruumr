import React from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import Matches from './Matches';
import LikesYou from './LikesYou';
import {useAuth} from '@/lib/AuthContext';
import {roomText as rt,roomDirection,useRoomLocale} from '@/lib/room-i18n';
export default function Inbox(){
 useRoomLocale();
 const {hasProfile}=useAuth();
 const [params,setParams]=useSearchParams();
 const likes=params.get('tab')==='likes';
 if(hasProfile===null)return <p role="status">{rt('hub.loading_account')}</p>;
 if(!hasProfile)return <section className="rr" dir={roomDirection()}><p>{rt('hub.publisher_messages_gate')}</p><Link to="/RoomAccount">{rt('hub.manage_publisher')}</Link></section>;
 return <div dir={roomDirection()}><div className="rh-pill-tabs" role="tablist" aria-label={rt('hub.messages')}>
 <button role="tab" aria-selected={!likes} onClick={()=>setParams({tab:'chats'})}>{rt('hub.chats')}</button>
 <button role="tab" aria-selected={likes} onClick={()=>setParams({tab:'likes'})}>{rt('hub.likes')}</button>
 </div>{likes?<LikesYou/>:<Matches embedded/>}</div>;
}
