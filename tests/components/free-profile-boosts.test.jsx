import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('@/api/profileBoosts', () => ({ profileBoosts: api }));
import RuumrPlus from '@/pages/RuumrPlus';
const ready={active:false,eligible:true,expiresAt:null,nextEligibleAt:null};
describe('sharing for a free boost', () => {
 beforeEach(async () => { api.mockReset(); api.mockResolvedValue(ready); await i18n.changeLanguage('en'); });
 const open=()=>render(<MemoryRouter><RuumrPlus /></MemoryRouter>);
 it('requires a separate confirmation after sharing', async () => {
  Object.defineProperty(navigator,'share',{configurable:true,value:vi.fn().mockResolvedValue(undefined)});
  open(); fireEvent.click(await screen.findByRole('button',{name:i18n.t('boost_share')}));
  const confirm=await screen.findByRole('button',{name:i18n.t('boost_confirm')});
  expect(api).toHaveBeenCalledTimes(1);
  fireEvent.click(confirm);
  await waitFor(()=>expect(api).toHaveBeenCalledWith('claim',{confirmedShared:true}));
 });
 it('cancelled sharing cannot activate a boost', async () => {
  Object.defineProperty(navigator,'share',{configurable:true,value:vi.fn().mockRejectedValue(new DOMException('Cancelled','AbortError'))});
  open(); fireEvent.click(await screen.findByRole('button',{name:i18n.t('boost_share')}));
  await waitFor(()=>expect(screen.getByRole('button',{name:i18n.t('boost_share')})).not.toBeDisabled());
  expect(screen.queryByRole('button',{name:i18n.t('boost_confirm')})).not.toBeInTheDocument();
  expect(api).toHaveBeenCalledTimes(1);
 });
 it('translates an already-displayed error and switches direction without reloading', async () => {
  api.mockRejectedValue(new Error('offline'));open();
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('boost_error'));
  await act(()=>i18n.changeLanguage('he'));
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('boost_error'));
  expect(screen.getByRole('main')).toHaveAttribute('dir','rtl');
  await act(()=>i18n.changeLanguage('en'));
  expect(screen.getByRole('main')).toHaveAttribute('dir','ltr');
 });
});
