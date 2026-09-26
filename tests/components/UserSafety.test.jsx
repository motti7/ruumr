import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReportProfileButton from '@/components/safety/ReportProfileButton';
import BlockChatButton from '@/components/safety/BlockChatButton';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/api/userSafety', () => ({ safetyRequest: request }));
afterEach(cleanup);
beforeEach(() => { request.mockReset(); });

describe('profile reporting', () => {
  it('offers reporting without a block button and submits the selected reason', async () => {
    request.mockResolvedValue({ success: true });
    render(<ReportProfileButton profileId="profile-b" />);
    expect(screen.queryByRole('button', { name: 'חסום משתמש' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'דווח על הפרופיל' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'spam' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Repeated spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'שלח דיווח' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('report', {
      profile_id: 'profile-b', reason: 'spam', details: 'Repeated spam',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('הדיווח נשלח');
  });
  it('keeps the report form available after a failure', async () => {
    request.mockRejectedValue(new Error('offline'));
    render(<ReportProfileButton profileId="profile-b" />);
    fireEvent.click(screen.getByRole('button', { name: 'דווח על הפרופיל' }));
    fireEvent.click(screen.getByRole('button', { name: 'שלח דיווח' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('הפעולה לא הושלמה');
    expect(screen.getByRole('button', { name: 'שלח דיווח' })).toBeEnabled();
  });
});

describe('chat blocking', () => {
  it('cancel performs no mutation; confirmation describes permanent bilateral deletion', () => {
    render(<BlockChatButton matchId="chat" onBlocked={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'חסום משתמש' }));
    expect(screen.getByText(/תמחק לצמיתות את השיחה וההודעות לשני הצדדים/)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(request).not.toHaveBeenCalled();
  });
  it('requires explicit confirmation and preserves pending-cleanup status', async () => {
    const result = { success: true, cleanup_pending: true };
    request.mockResolvedValue(result);
    const done = vi.fn();
    render(<BlockChatButton matchId="chat" onBlocked={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'חסום משתמש' }));
    fireEvent.click(screen.getByRole('button', { name: 'חסום ומחק את השיחה' }));
    await waitFor(() => expect(done).toHaveBeenCalledWith(result));
    expect(request).toHaveBeenCalledWith('block', { match_id: 'chat', confirm: true });
  });
  it('failed block never removes the conversation', async () => {
    request.mockRejectedValue(new Error('offline'));
    const done = vi.fn();
    render(<BlockChatButton matchId="chat" onBlocked={done} />);
    fireEvent.click(screen.getByRole('button', { name: 'חסום משתמש' }));
    fireEvent.click(screen.getByRole('button', { name: 'חסום ומחק את השיחה' }));
    await screen.findByRole('alert');
    expect(done).not.toHaveBeenCalled();
  });
});

