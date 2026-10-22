// A fixed internal destination, never an arbitrary redirect supplied by a URL.
export function roomAuthDestination() {
  try {
    const next=new URLSearchParams(window.location.search).get('next');
    const offerId=new URLSearchParams(window.location.search).get('offerId');
    if(next==='RoomChat'&&/^[\w-]{1,100}$/.test(offerId||''))return '/RoomChat?offerId='+encodeURIComponent(offerId);
    const chat=JSON.parse(sessionStorage.getItem('ruumr_room_chat_intent')||'null');
    if(!next&&chat&&Date.now()-chat.time<30*60*1000&&/^[\w-]{1,100}$/.test(chat.id))return '/RoomChat?offerId='+encodeURIComponent(chat.id);
    if(next==='Partner')return '/Discover?view=people';
    if(next==='AddRoom')return '/AddRoom';
    const partnerTime=Number(sessionStorage.getItem('ruumr_partner_auth_intent'));
    if(partnerTime && Date.now()-partnerTime<30*60*1000)return '/Discover?view=people';
    const time=Number(sessionStorage.getItem('ruumr_room_auth_intent'));
    if(time && Date.now()-time<30*60*1000)return '/AddRoom';
  }catch{/* Storage may be disabled. */}
  return '/';
}
export function rememberRoomAuth() {
 try {
  const params=new URLSearchParams(window.location.search),next=params.get('next'),id=params.get('offerId');
  if(next==='RoomChat'&&/^[\w-]{1,100}$/.test(id||'')){sessionStorage.removeItem('ruumr_partner_auth_intent');sessionStorage.removeItem('ruumr_room_auth_intent');sessionStorage.setItem('ruumr_room_chat_intent',JSON.stringify({id,time:Date.now()}));}
  else if(next==='Partner'){sessionStorage.removeItem('ruumr_room_chat_intent');sessionStorage.removeItem('ruumr_room_auth_intent');sessionStorage.setItem('ruumr_partner_auth_intent',String(Date.now()));}
  else if(next==='AddRoom'){sessionStorage.removeItem('ruumr_room_chat_intent');sessionStorage.removeItem('ruumr_partner_auth_intent');sessionStorage.setItem('ruumr_room_auth_intent',String(Date.now()));}
 }catch{/* optional */}
}
