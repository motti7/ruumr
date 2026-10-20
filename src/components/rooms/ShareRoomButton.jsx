import React, { useState, useRef, useEffect } from 'react';
import { Share2, MessageCircle, Link2, Check } from 'lucide-react';
import { roomText as rt } from '@/lib/room-i18n';

function roomUrl(id) {
  return new URL('/Room/' + encodeURIComponent(id), window.location.origin).toString();
}

export default function ShareRoomButton({ room }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const url = roomUrl(room.id);
  const text = `${room.title || ''} — ${rt(room.city || '')}\n${url}`;

  const shareWhatsapp = () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1400);
  };

  return (
    <span className="rf-share" ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" className="rr-add" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>
        <Share2 size={17} />{rt('hub.share')}
      </button>
      {open && (
        <div role="menu" className="rf-share-menu" style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', insetInlineStart: 0,
          background: '#fff', border: '1px solid #e9e5df', borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.14)', padding: 6, zIndex: 30, minWidth: 190
        }}>
          <button type="button" role="menuitem" onClick={shareWhatsapp} className="rf-share-item">
            <MessageCircle size={18} />{rt('hub.share_whatsapp')}
          </button>
          <button type="button" role="menuitem" onClick={copyLink} className="rf-share-item">
            {copied ? <Check size={18} /> : <Link2 size={18} />}
            {copied ? rt('hub.share_copied') : rt('hub.share_copy')}
          </button>
        </div>
      )}
    </span>
  );
}