import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Review entity schema', () => {
  let schema;

  beforeAll(() => {
    const raw = readFileSync(
      resolve(__dirname, '../../base44/entities/Review.jsonc'),
      'utf-8'
    );
    schema = JSON.parse(raw);
  });

  it('restricts create, update, and delete to the reviewer', () => {
    const reviewerOnly = {
      $and: [
        { created_by: '{{user.email}}' },
        { 'data.reviewer_id': '{{user.id}}' },
      ],
    };
    expect(schema.rls.create).toEqual(reviewerOnly);
    expect(schema.rls.update).toEqual(reviewerOnly);
    expect(schema.rls.delete).toEqual(reviewerOnly);
  });

  it('allows public read access', () => {
    expect(schema.rls.read).toBe(true);
  });

  it('requires reviewer_id, reviewed_id, and rating', () => {
    expect(schema.required).toContain('reviewer_id');
    expect(schema.required).toContain('reviewed_id');
    expect(schema.required).toContain('rating');
  });
});
