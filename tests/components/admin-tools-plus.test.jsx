import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Shared mock fns, hoisted so the vi.mock factories below can close over them.
const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  search: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/entities/User', () => ({ User: { me: mocks.me } }));
vi.mock('@/api/ruumrPlus', () => ({
  searchRuumrPlusUsers: mocks.search,
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
  mocks.search.mockResolvedValue([]);
  mocks.grant.mockResolvedValue({ is_ruumr_plus: true });
  mocks.revoke.mockResolvedValue({ is_ruumr_plus: false });
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
const ENABLE_IOS = /אפשר iOS/;

describe('AdminTools — Ruumr Plus grant/revoke', () => {
  it('redirects non-admins to Discover and never lists users', async () => {
    mocks.me.mockResolvedValue({ id: 'u1', role: 'user' });
    renderPage();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('grants Plus via the bridge and shows the Plus badge', async () => {
    mocks.search.mockResolvedValue([
      { id: 'u2', full_name: 'Bob', email: 'bob@x.com', is_ruumr_plus: false },
    ]);
    renderPage();

    const grantBtn = await screen.findByRole('button', { name: GRANT });
    fireEvent.click(grantBtn);

    await waitFor(() => expect(mocks.grant).toHaveBeenCalledWith({ userId: 'u2' }));

    // Row now reflects Plus, and the button flips to revoke.
    const row = (await screen.findByText('Bob')).closest('div').parentElement;
    expect(within(row).getByText('Plus')).toBeTruthy();
    await screen.findByRole('button', { name: REVOKE });
  });

  it('does NOT mark the row as Plus when the grant fails', async () => {
    mocks.grant.mockRejectedValue(new Error('service 500'));
    mocks.search.mockResolvedValue([
      { id: 'u3', full_name: 'Carol', email: 'carol@x.com', is_ruumr_plus: false },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: GRANT }));

    await screen.findByText(/service 500/);
    // Still grantable — nothing changed.
    expect(screen.getByRole('button', { name: GRANT })).toBeTruthy();
    expect(screen.queryByRole('button', { name: REVOKE })).toBeNull();
  });

  it('revokes Plus via the bridge', async () => {
    mocks.search.mockResolvedValue([
      { id: 'u4', full_name: 'Dave', email: 'dave@x.com', is_ruumr_plus: true },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: REVOKE }));

    await waitFor(() => expect(mocks.revoke).toHaveBeenCalledWith({ userId: 'u4' }));
    // Row flips back to grantable.
    await screen.findByRole('button', { name: GRANT });
  });

  it('lets admins convert an existing web-paid Plus user into an iOS-allowed admin grant', async () => {
    mocks.search.mockResolvedValue([
      { id: 'u7', full_name: 'Wendy', email: 'wendy@x.com', is_ruumr_plus: true, ruumr_plus_source: 'wix_paid' },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: ENABLE_IOS }));

    await waitFor(() => expect(mocks.grant).toHaveBeenCalledWith({ userId: 'u7' }));
    expect(await screen.findByText('iOS פעיל')).toBeTruthy();
  });

  it('filters the user list by the search query', async () => {
    mocks.search.mockResolvedValue([
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
