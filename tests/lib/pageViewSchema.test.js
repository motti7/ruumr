import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('PageView entity schema', () => {
  let schema;

  beforeAll(() => {
    const raw = readFileSync(
      resolve(__dirname, '../../base44/entities/PageView.jsonc'),
      'utf-8'
    );
    schema = JSON.parse(raw);
  });

  it('restricts create to the authenticated user matching the record owner', () => {
    expect(schema.rls.create).toEqual({
      $and: [
        { created_by: '{{user.email}}' },
        { 'data.user_id': '{{user.id}}' },
      ],
    });
  });

  it('allows the record owner or an admin to read', () => {
    expect(schema.rls.read).toEqual({
      $or: [
        { 'data.user_id': '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    });
  });

  it('restricts update and delete to admins', () => {
    const adminOnly = { user_condition: { role: 'admin' } };
    expect(schema.rls.update).toEqual(adminOnly);
    expect(schema.rls.delete).toEqual(adminOnly);
  });

  it('requires page_name', () => {
    expect(schema.required).toContain('page_name');
  });
});
