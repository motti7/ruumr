import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Shared mock fns, hoisted so the vi.mock factories below can close over them.
const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/entities/User', () => ({ User: { me: mocks.me } }));
vi.mock('@/api/base44Client', () => ({
  base44: { entities: { User: { list: mocks.list, update: mocks.update } } },
}));
vi.mock('@/api/ruumrPlus', () => ({
  grantRuumrPlusEntitlement: mocks.grant,
  revokeRuumrPlusEntitlement: mocks.revoke,
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mocks.navigate };
});

let AdminToolsPage;

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.me.mockResolvedValue({ id: 'admin1', role: 'admin', email: 'admin@ruumr.app' });
  mocks.update.mockResolvedValue({});
  mocks.grant.mockResolvedValue({ ok: true });
  mocks.revoke.mockResolvedValue({ ok: true });
  vi.resetModules();
  AdminToolsPage = (await import('@/pages/AdminTools')).default;
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/AdminTools']}>
      <AdminToolsPage />
    </MemoryRouter>
  );
}

const GRANT = /הפעל Plus/;
const REVOKE = /בטל Plus/;

describe('AdminTools — Ruumr Plus grant/revoke', () => {
  it('redirects non-admins to Discover and never lists users', async () => {
    mocks.me.mockResolvedValue({ id: 'u1', role: 'user' });
    renderPage();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('grants the service entitlement BEFORE flipping the Base44 flag, then shows the Plus badge', async () => {
    mocks.list.mockResolvedValue([
      { id: 'u2', full_name: 'Bob', email: 'bob@x.com', is_ruumr_plus: false },
    ]);
    renderPage();

    const grantBtn = await screen.findByRole('button', { name: GRANT });
    fireEvent.click(grantBtn);

    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.grant).toHaveBeenCalledWith({ userId: 'u2' });
    expect(mocks.update).toHaveBeenCalledWith('u2', { is_ruumr_plus: true });

    // Server grant must run before the local flag is set.
    expect(mocks.grant.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.update.mock.invocationCallOrder[0]
    );

    // Row now reflects Plus, and the button flips to revoke.
    const row = (await screen.findByText('Bob')).closest('div').parentElement;
    expect(within(row).getByText('Plus')).toBeTruthy();
    await screen.findByRole('button', { name: REVOKE });
  });

  it('does NOT flip the Base44 flag when the service grant fails', async () => {
    mocks.grant.mockRejectedValue(new Error('service 500'));
    mocks.list.mockResolvedValue([
      { id: 'u3', full_name: 'Carol', email: 'carol@x.com', is_ruumr_plus: false },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: GRANT }));

    await screen.findByText(/service 500/);
    expect(mocks.update).not.toHaveBeenCalled();
    // Still grantable — nothing changed.
    expect(screen.getByRole('button', { name: GRANT })).toBeTruthy();
  });

  it('revokes by clearing the Base44 flag first, then the service entitlement', async () => {
    mocks.list.mockResolvedValue([
      { id: 'u4', full_name: 'Dave', email: 'dave@x.com', is_ruumr_plus: true },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: REVOKE }));

    await waitFor(() => expect(mocks.revoke).toHaveBeenCalledWith({ userId: 'u4' }));
    expect(mocks.update).toHaveBeenCalledWith('u4', { is_ruumr_plus: false });
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.revoke.mock.invocationCallOrder[0]
    );
  });

  it('filters the user list by the search query', async () => {
    mocks.list.mockResolvedValue([
      { id: 'u5', full_name: 'Erin', email: 'erin@x.com', is_ruumr_plus: false },
      { id: 'u6', full_name: 'Frank', email: 'frank@x.com', is_ruumr_plus: false },
    ]);
    renderPage();

    await screen.findByText('Erin');
    fireEvent.change(screen.getByPlaceholderText(/חיפוש/), { target: { value: 'frank' } });

    expect(screen.queryByText('Erin')).toBeNull();
    expect(screen.getByText('Frank')).toBeTruthy();
  });
});
