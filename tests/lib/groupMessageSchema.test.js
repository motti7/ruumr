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

  it('restricts create, update, and delete to the message sender', () => {
    const senderOnly = {
      $and: [
        { created_by: '{{user.email}}' },
        { 'data.sender_id': '{{user.id}}' },
      ],
    };
    expect(schema.rls.create).toEqual(senderOnly);
    expect(schema.rls.update).toEqual(senderOnly);
    expect(schema.rls.delete).toEqual(senderOnly);
  });

  it('allows group owner, sender, or admin to read messages', () => {
    expect(schema.rls.read).toEqual({
      $or: [
        { 'data.group_id': '{{user.id}}' },
        { 'data.sender_id': '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    });
  });

  it('requires group_id, sender_id, and content', () => {
    expect(schema.required).toContain('group_id');
    expect(schema.required).toContain('sender_id');
    expect(schema.required).toContain('content');
  });
});
