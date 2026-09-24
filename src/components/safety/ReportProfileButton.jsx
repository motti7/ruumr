import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { safetyRequest } from '@/api/userSafety';

export default function ReportProfileButton({ profileId }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setPending(true);
    setError(false);
    try {
      const result = await safetyRequest('report', { profile_id: profileId, reason, details });
      if (result.success !== true) throw new Error('Report not confirmed');
      setSent(true);
    } catch { setError(true); } finally { setPending(false); }
  };
  return <>
    <button type="button" onClick={() => { setOpen(true); setError(false); }}
      className="min-h-[44px] min-w-[44px] p-2 text-gray-600 rounded-full hover:bg-gray-100"
      aria-label={t('safety_report_profile')}><Flag className="w-5 h-5" /></button>
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
      <DialogContent dir={i18n.dir()} className="z-[400] max-w-sm w-[calc(100%_-_2rem)] rounded-2xl" onClick={e => e.stopPropagation()}>
        <DialogHeader><DialogTitle>{t('safety_report_profile')}</DialogTitle>
          <DialogDescription>{t('safety_report_description')}</DialogDescription></DialogHeader>
        {sent ? <p role="status">{t('safety_report_sent')}</p> : <form onSubmit={submit} className="space-y-4">
          <label className="block">{t('safety_reason')}
            <select value={reason} onChange={e => setReason(e.target.value)} disabled={pending}
              className="block w-full border rounded-xl p-3 mt-2">
              {['harassment', 'fake_profile', 'inappropriate_content', 'spam', 'other'].map(value =>
                <option key={value} value={value}>{t(`safety_reason_${value}`)}</option>)}
            </select>
          </label>
          <label className="block">{t('safety_details')}
            <textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={2000}
              disabled={pending} className="block w-full border rounded-xl p-3 mt-2 min-h-24" />
          </label>
          {error && <p role="alert" className="text-red-600">{t('safety_request_failed')}</p>}
          <Button type="submit" disabled={pending} className="w-full">{t(pending ? 'loading' : 'safety_send_report')}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}

