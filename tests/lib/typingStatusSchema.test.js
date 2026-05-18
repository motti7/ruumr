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

  it('restricts create, update, and delete to the record owner via user_id and created_by', () => {
    const ownerOnly = {
      $and: [
        { 'data.user_id': '{{user.id}}' },
        { created_by: '{{user.email}}' },
      ],
    };
    expect(schema.rls.create).toEqual(ownerOnly);
    expect(schema.rls.update).toEqual(ownerOnly);
    expect(schema.rls.delete).toEqual(ownerOnly);
  });

  it('restricts read to the record owner or an admin', () => {
    expect(schema.rls.read).toEqual({
      $or: [
        { 'data.user_id': '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    });
  });

  it('requires match_id and user_id', () => {
    expect(schema.required).toContain('match_id');
    expect(schema.required).toContain('user_id');
  });
});
