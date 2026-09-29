// A fixed internal destination, never an arbitrary redirect supplied by a URL.
export function roomAuthDestination() {
  try {
    const next=new URLSearchParams(window.location.search).get('next');
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
  try{const next=new URLSearchParams(window.location.search).get('next');if(next==='Partner'){sessionStorage.removeItem('ruumr_room_auth_intent');sessionStorage.setItem('ruumr_partner_auth_intent',String(Date.now()));}else if(next==='AddRoom'){sessionStorage.removeItem('ruumr_partner_auth_intent');sessionStorage.setItem('ruumr_room_auth_intent',String(Date.now()));}}catch{/* optional */}
}
