import React from 'react';
import {Link} from 'react-router-dom';
import {useOptionalAuth} from '@/lib/AuthContext';
import {roomText as rt,useRoomLocale} from '@/lib/room-i18n';
export default function RoommateAccess({children}){
 useRoomLocale();
 const {hasProfile}=useOptionalAuth();
 if(hasProfile===null)return <p className="p-8 text-center" role="status">{rt('hub.loading_account')}</p>;
 if(hasProfile)return children;
 return <div className="rr" style={{paddingTop:80}}><p>{rt('hub.publisher_partner_gate')}</p>
 <Link className="rr-add" to="/Onboarding">{rt('hub.complete_partner')}</Link>
 <Link to="/RoomAccount">{rt('hub.manage_publisher')}</Link>
 <Link to="/Discover?view=rooms">{rt('hub.back_to_rooms')}</Link></div>;
}
