import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('TypingStatus entity schema', () => {
  let schema;

  beforeAll(() => {
    const raw = readFileSync(
      resolve(__dirname, '../../base44/entities/TypingStatus.jsonc'),
      'utf-8'
    );
    schema = JSON.parse(raw);
  });

  it('requires server block checks before creating or modifying typing signals', () => {
    expect(schema.rls.create).toBe(false);
    expect(schema.rls.update).toEqual({ user_condition: { role: 'admin' } });
  });

  it('does not expose typing signals to every user', () => {
    expect(schema.rls.read).not.toBe(true);
    expect(schema.rls.read.$or).toContainEqual({ 'data.user_id': '{{user.id}}' });
  });

  it('requires match_id and user_id', () => {
    expect(schema.required).toContain('match_id');
    expect(schema.required).toContain('user_id');
  });
});

