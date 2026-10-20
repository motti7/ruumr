import React, { useEffect, useState } from 'react';
import { roomText as rt } from '@/lib/room-i18n';
import { base44 } from '@/api/base44Client';

// Module-level cache so every RoomWhatsAppButton in a feed shares one fetch
// of the current user's public profile link.
let cachedProfileLink = null;
let cachePromise = null;

async function getMyProfileLink() {
  if (cachedProfileLink !== null) return cachedProfileLink;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    try {
      const me = await base44.auth.me();
      if (me && me.id) {
        cachedProfileLink = `${window.location.origin}/PublicProfile?userId=${encodeURIComponent(me.id)}`;
      } else {
        cachedProfileLink = '';
      }
    } catch {
      cachedProfileLink = '';
    }
    return cachedProfileLink;
  })();
  return cachePromise;
}

function toWhatsAppNumber(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/[\s()-]/g, '');
  if (!p) return '';
  if (/^0\d+$/.test(p)) p = '972' + p.slice(1);       // Israeli local → 972
  else if (/^\+972/.test(p)) p = p.replace('+', '');
  else if (/^\+/.test(p)) p = p.replace('+', '');
  return p;
}

export default function RoomWhatsAppButton({ room }) {
  const [profileLink, setProfileLink] = useState(null);

  useEffect(() => {
    let active = true;
    getMyProfileLink().then((link) => { if (active) setProfileLink(link); });
    return () => { active = false; };
  }, []);

  const handleClick = () => {
    const num = toWhatsAppNumber(room.phone);
    const link = profileLink || '';
    const greeting = rt('feed.whatsapp_greeting');
    const msg = link
      ? `${greeting}\n${rt('feed.whatsapp_my_profile', { link })}`
      : greeting;
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
    const url = `${base}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
  };

  if (!room.phone) return null;

  return (
    <button
      type="button"
      className="rr-add rf-whatsapp"
      onClick={handleClick}
      aria-label={rt('feed.whatsapp')}
    >
      {rt('feed.whatsapp')}
    </button>
  );
}