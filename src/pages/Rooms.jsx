import {roomText as rt, roomDirection, useRoomLocale} from '@/lib/room-i18n';
import React from 'react';
import {Link} from 'react-router-dom';
import RoomListings from '@/components/rooms/RoomListings';
import {useAuth} from '@/lib/AuthContext';
import '@/components/scrapingPilot/discover-tabs.css';
export default function Rooms(){
  useRoomLocale();
  const {isAuthenticated}=useAuth();
  return <div dir={roomDirection()}><div className="discover-mode-bar"><div aria-label={rt("שותפים וחדרים")}><Link className="rr-add" to={isAuthenticated?'/Discover':'/login'}>{rt("שותפים")}</Link><span className="rr-add" aria-current="page">{rt("חדרים")}</span></div></div><div style={{paddingTop:52}}><RoomListings/></div></div>;
}
