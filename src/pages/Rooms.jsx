import {roomText as rt, roomDirection, useRoomLocale} from '@/lib/room-i18n';
import React from 'react';
import {Link, Navigate} from 'react-router-dom';
import RoomListings from '@/components/rooms/RoomListings';
import { showsRoomFeed } from '@/lib/userRegion';

import '@/components/scrapingPilot/discover-tabs.css';
export default function Rooms(){
  useRoomLocale();

  // No rooms feed in the US marketplace — send those visitors to the roommate feed.
  if (!showsRoomFeed()) return <Navigate to="/Discover?view=people" replace />;

  return <div dir={roomDirection()}><div className="discover-mode-bar"><div role="tablist" aria-label={rt("שותפים וחדרים")}><Link role="tab" aria-selected={false} className="" to="/Discover?view=people">{rt("שותפים")}</Link><span role="tab" aria-selected={true} className="" aria-current="page">{rt("חדרים")}</span></div></div><div style={{paddingTop:52}}><RoomListings/></div></div>;
}