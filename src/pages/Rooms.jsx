import {roomText as rt, roomDirection, useRoomLocale} from '@/lib/room-i18n';
import React from 'react';
import {Link} from 'react-router-dom';
import RoomListings from '@/components/rooms/RoomListings';
import { useOptionalAuth } from '@/lib/AuthContext';

import '@/components/scrapingPilot/discover-tabs.css';
export default function Rooms(){
  useRoomLocale();
  const { isAuthenticated } = useOptionalAuth();
  // Roommates is a members' area. Guests who switch to it go through sign-in and
  // land straight back on the roommates view (see room-auth destination).
  const peopleHref = isAuthenticated ? '/Discover?view=people' : '/login?next=Partner';

  return <div dir={roomDirection()}>
    {/* Desktop: the partners/rooms switch sits in the page flow (a compact
        segmented control) instead of a fixed strip glued under the header. */}
    <div className="rk-desk-switch"><div role="tablist" aria-label={rt("שותפים וחדרים")}><Link role="tab" aria-selected={false} to={peopleHref}>{rt("שותפים")}</Link><span role="tab" aria-selected={true} aria-current="page">{rt("חדרים")}</span></div></div>
    <div className="lg:hidden"><div className="discover-mode-bar"><div role="tablist" aria-label={rt("שותפים וחדרים")}><Link role="tab" aria-selected={false} className="" to={peopleHref}>{rt("שותפים")}</Link><span role="tab" aria-selected={true} className="" aria-current="page">{rt("חדרים")}</span></div></div></div>
    <div className="pt-[52px] lg:pt-0"><RoomListings/></div>
  </div>;
}