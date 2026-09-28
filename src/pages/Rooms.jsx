import React from 'react';
import {Link} from 'react-router-dom';
import RoomListings from '@/components/rooms/RoomListings';
import {useAuth} from '@/lib/AuthContext';
import '@/components/scrapingPilot/discover-tabs.css';
export default function Rooms(){
  const {isAuthenticated}=useAuth();
  return <div dir="rtl"><div className="discover-mode-bar"><div aria-label="שותפים וחדרים"><Link className="rr-add" to={isAuthenticated?'/Discover':'/login'}>שותפים</Link><span className="rr-add" aria-current="page">חדרים</span></div></div><div style={{paddingTop:52}}><RoomListings/></div></div>;
}
