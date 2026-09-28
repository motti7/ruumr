// A fixed internal destination, never an arbitrary redirect supplied by a URL.
export function roomAuthDestination() {
  try {
    if(new URLSearchParams(window.location.search).get('next')==='AddRoom')return '/AddRoom';
    const time=Number(sessionStorage.getItem('ruumr_room_auth_intent'));
    if(time && Date.now()-time<30*60*1000)return '/AddRoom';
  }catch{/* Storage may be disabled. */}
  return '/';
}
export function rememberRoomAuth() {
  if(roomAuthDestination()==='/AddRoom')try{sessionStorage.setItem('ruumr_room_auth_intent',String(Date.now()));}catch{/* optional */}
}
