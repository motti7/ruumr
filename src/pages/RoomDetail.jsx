import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { roomText as rt, roomDirection, useRoomLocale } from '@/lib/room-i18n';
import { roomRequest } from '@/components/rooms/RoomListings';
import RoomFeedCard from '@/components/rooms/RoomFeedCard';
import '@/components/rooms/rooms.css';

export default function RoomDetail() {
  useRoomLocale();
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    roomRequest({ action: 'list', room_id: id })
      .then(data => { if (active) setRoom(data.records[0] || null); })
      .catch(() => { if (active) setError(rt('hub.room_not_found')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <section className="rr rf-feed" dir={roomDirection()} style={{ paddingTop: 16 }}>
      <Link to="/Rooms" className="rr-add" style={{ marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ArrowRight size={16} style={{ transform: roomDirection() === 'rtl' ? 'scaleX(-1)' : 'none' }} />
        {rt('hub.back_to_rooms')}
      </Link>

      {loading && <p role="status">{rt('hub.loading')}</p>}
      {error && <p role="alert">{error} <Link to="/Rooms">{rt('hub.back_to_rooms')}</Link></p>}
      {!loading && !error && !room && <p role="alert">{rt('hub.room_not_found')} <Link to="/Rooms">{rt('hub.back_to_rooms')}</Link></p>}
      {!loading && !error && room && (
        <div className="rf-list">
          <RoomFeedCard room={room} saved={false} footer={null} />
        </div>
      )}
    </section>
  );
}