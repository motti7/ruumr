import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { safetyRequest } from '@/api/userSafety';

export default function BlockChatButton({ matchId, onBlocked }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const block = async () => {
    setPending(true);
    setError(false);
    try {
      const result = await safetyRequest('block', { match_id: matchId, confirm: true });
      if (result.success !== true) throw new Error('Block not confirmed');
      window.dispatchEvent(new Event('ruumrSafetyChanged'));
      onBlocked(result);
    } catch { setError(true); setPending(false); }
  };
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={t('safety_block')}
      className="min-h-[44px] min-w-[44px] p-2 text-gray-600 rounded-full hover:bg-gray-100"><Ban className="w-5 h-5" /></button>
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
      <DialogContent dir={i18n.dir()} className="max-w-sm w-[calc(100%_-_2rem)] rounded-2xl">
        <DialogHeader><DialogTitle>{t('safety_block')}</DialogTitle>
          <DialogDescription>{t('safety_block_warning')}</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-red-600">{t('safety_request_failed')}</p>}
        <Button variant="destructive" disabled={pending} onClick={block}>{t(pending ? 'loading' : 'safety_confirm_block')}</Button>
        <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>{t('cancel')}</Button>
      </DialogContent>
    </Dialog>
  </>;
}

