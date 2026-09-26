import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const schema = JSON.parse(fs.readFileSync('base44/entities/Message.jsonc', 'utf8'));

describe('Message schema', () => {
  it('retains participant fields for server-side notification processing', () => {
    expect(schema.properties.user1_id.type).toBe('string');
    expect(schema.properties.user2_id.type).toBe('string');
  });
  it('prevents bypassing server block checks by creating messages directly', () => {
    expect(schema.rls.create).toBe(false);
  });
  for (const operation of ['read', 'update']) {
    it(`requires the safety endpoint for ${operation}, preserving administrator access`, () => {
      expect(schema.rls[operation]).toEqual({ user_condition: { role: 'admin' } });
    });
  }
});

