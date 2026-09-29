import {roomText as rt, roomDirection, useRoomLocale} from '@/lib/room-i18n';
import React from 'react';
import {Link} from 'react-router-dom';
import RoomListings from '@/components/rooms/RoomListings';

import '@/components/scrapingPilot/discover-tabs.css';
export default function Rooms(){
  useRoomLocale();
  
  return <div dir={roomDirection()}><div className="discover-mode-bar"><div role="tablist" aria-label={rt("שותפים וחדרים")}><Link role="tab" aria-selected={false} className="rr-add" to="/Discover?view=people">{rt("שותפים")}</Link><span role="tab" aria-selected={true} className="rr-add" aria-current="page">{rt("חדרים")}</span></div></div><div style={{paddingTop:52}}><RoomListings/></div></div>;
}
