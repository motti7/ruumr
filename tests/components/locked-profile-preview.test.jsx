import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LockedProfilePreview from '@/components/discover/LockedProfilePreview';

describe('LockedProfilePreview', () => {
  it('renders the "complete profile" CTA and locked heading', () => {
    render(<LockedProfilePreview onComplete={() => {}} />);
    expect(screen.getByRole('button', { name: 'השלמת פרופיל' })).toBeTruthy();
    expect(screen.getByText('השלימו את הפרופיל כדי להתחיל')).toBeTruthy();
  });

  it('calls onComplete when the CTA is tapped', () => {
    const onComplete = vi.fn();
    render(<LockedProfilePreview onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'השלמת פרופיל' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('blurs its placeholder card so no underlying data is legible', () => {
    const { container } = render(<LockedProfilePreview onComplete={() => {}} />);
    const blurred = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find(
      (el) => (el.getAttribute('style') || '').includes('blur')
    );
    expect(blurred).toBeTruthy();
  });
});
