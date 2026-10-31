import React from 'react';
import {Link} from 'react-router-dom';
import {LockKeyhole,Phone} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {roomText as rt,useRoomLocale} from '@/lib/room-i18n';
import RoomWhatsAppButton from './RoomWhatsAppButton';

export default function RoomContactActions({room}) {
  useRoomLocale();
  const {isAuthenticated}=useAuth();
  if(!isAuthenticated||room.contact_locked) {
    const query='?next=RoomContact&roomId='+encodeURIComponent(room.id);
    return <div className="rf-contact-gate"><p>{rt('feed.contact_signin')}</p>
      <Link className="rr-add rr-primary" to={'/login'+query}><LockKeyhole size={17}/>{rt('feed.reveal_phone')}</Link>
      <Link className="rr-add rf-whatsapp" to={'/login'+query}>{rt('feed.whatsapp_signin')}</Link>
      <Link to={'/register'+query}>{rt('feed.contact_register')}</Link>
    </div>;
  }
  if(!room.phone)return null;
  return <><a href={'tel:'+room.phone} className="rr-add rr-primary"><Phone size={17}/>{rt('feed.call')} <bdi>{room.phone}</bdi></a><RoomWhatsAppButton room={room}/></>;
}
