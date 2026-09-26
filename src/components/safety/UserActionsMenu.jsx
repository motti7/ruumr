import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Flag, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { safetyRequest } from '@/api/userSafety';

/**
 * Unified user-actions menu for Chat and ProfileView.
 * Shows an overflow ("⋮") button that opens a dropdown with:
 *  - Report (always available, needs profileId)
 *  - Block (only when matchId is provided — blocking requires a match)
 * Each action opens its own confirmation/report dialog, reusing the same
 * safetyRequest flows the previous dedicated buttons used.
 */
export default function UserActionsMenu({ profileId, matchId, onBlocked }) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  // Report dialog state
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [reportPending, setReportPending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState(false);

  // Block dialog state
  const [blockPending, setBlockPending] = useState(false);
  const [blockError, setBlockError] = useState(false);

  const openReport = () => {
    setMenuOpen(false);
    setReportSent(false);
    setReportError(false);
    setReportOpen(true);
  };

  const openBlock = () => {
    setMenuOpen(false);
    setBlockError(false);
    setBlockOpen(true);
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setReportPending(true);
    setReportError(false);
    try {
      const result = await safetyRequest('report', { profile_id: profileId, reason, details });
      if (result.success !== true) throw new Error('Report not confirmed');
      setReportSent(true);
    } catch {
      setReportError(true);
    } finally {
      setReportPending(false);
    }
  };

  const doBlock = async () => {
    setBlockPending(true);
    setBlockError(false);
    try {
      const result = await safetyRequest('block', { match_id: matchId, confirm: true });
      if (result.success !== true) throw new Error('Block not confirmed');
      window.dispatchEvent(new Event('ruumrSafetyChanged'));
      onBlocked?.(result);
    } catch {
      setBlockError(true);
      setBlockPending(false);
    }
  };

  const closeReport = (value) => {
    if (!reportPending) {
      setReportOpen(value);
      if (!value) setReportSent(false);
    }
  };

  const closeBlock = (value) => {
    if (!blockPending) setBlockOpen(value);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('safety_actions_menu')}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-600 rounded-full hover:bg-gray-100 flex items-center justify-center no-tap-expand"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'} className="w-48">
          <DropdownMenuItem onClick={openReport} className="gap-2 text-red-600 focus:text-red-600">
            <Flag className="w-4 h-4" />
            {t('safety_report_profile')}
          </DropdownMenuItem>
          {matchId && (
            <DropdownMenuItem onClick={openBlock} className="gap-2 text-red-600 focus:text-red-600">
              <Ban className="w-4 h-4" />
              {t('safety_block')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={closeReport}>
        <DialogContent dir={i18n.dir()} className="z-[400] max-w-sm w-[calc(100%_-_2rem)] rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('safety_report_profile')}</DialogTitle>
            <DialogDescription>{t('safety_report_description')}</DialogDescription>
          </DialogHeader>
          {reportSent ? (
            <p role="status">{t('safety_report_sent')}</p>
          ) : (
            <form onSubmit={submitReport} className="space-y-4">
              <label className="block">
                {t('safety_reason')}
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={reportPending}
                  className="block w-full border rounded-xl p-3 mt-2"
                >
                  {['harassment', 'fake_profile', 'inappropriate_content', 'spam', 'other'].map((value) => (
                    <option key={value} value={value}>
                      {t(`safety_reason_${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {t('safety_details')}
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  disabled={reportPending}
                  className="block w-full border rounded-xl p-3 mt-2 min-h-24"
                />
              </label>
              {reportError && <p role="alert" className="text-red-600">{t('safety_request_failed')}</p>}
              <Button type="submit" disabled={reportPending} className="w-full">
                {t(reportPending ? 'loading' : 'safety_send_report')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Block dialog */}
      {matchId && (
        <Dialog open={blockOpen} onOpenChange={closeBlock}>
          <DialogContent dir={i18n.dir()} className="max-w-sm w-[calc(100%_-_2rem)] rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t('safety_block')}</DialogTitle>
              <DialogDescription>{t('safety_block_warning')}</DialogDescription>
            </DialogHeader>
            {blockError && <p role="alert" className="text-red-600">{t('safety_request_failed')}</p>}
            <Button variant="destructive" disabled={blockPending} onClick={doBlock}>
              {t(blockPending ? 'loading' : 'safety_confirm_block')}
            </Button>
            <Button variant="outline" disabled={blockPending} onClick={() => setBlockOpen(false)}>
              {t('cancel')}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}