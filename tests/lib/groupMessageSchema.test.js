import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('GroupMessage entity schema', () => {
  let schema;

  beforeAll(() => {
    const raw = readFileSync(
      resolve(__dirname, '../../base44/entities/GroupMessage.jsonc'),
      'utf-8'
    );
    schema = JSON.parse(raw);
  });

  it('restricts all four RLS operations to the message sender', () => {
    const senderOnly = { created_by: '{{user.email}}' };
    expect(schema.rls.create).toEqual(senderOnly);
    expect(schema.rls.read).toEqual(senderOnly);
    expect(schema.rls.update).toEqual(senderOnly);
    expect(schema.rls.delete).toEqual(senderOnly);
  });

  it('requires group_id, sender_id, and content', () => {
    expect(schema.required).toContain('group_id');
    expect(schema.required).toContain('sender_id');
    expect(schema.required).toContain('content');
  });
});
