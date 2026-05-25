import { describe, expect, it } from 'vitest';
import { applyTwoStageSwipeFilter } from '@/lib/ruumrPlusDisplayFilter';

const rec = (id, score) => ({ user_id: id, score });

const recommendations = [
  rec('A', 0.95),
  rec('B', 0.90),
  rec('C', 0.85),
  rec('D', 0.80),
  rec('E', 0.75),
  rec('F', 0.70),
  rec('G', 0.65),
  rec('H', 0.60),
  rec('I', 0.55),
  rec('J', 0.50),
];

const swipe = (id, action) => ({ swiped_id: id, action });

describe('applyTwoStageSwipeFilter', () => {
  it('returns the top targetCount when no swipes exist', () => {
    const result = applyTwoStageSwipeFilter(recommendations, [], 5);
    expect(result.map((r) => r.user_id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('returns an empty array for empty or invalid input', () => {
    expect(applyTwoStageSwipeFilter([], [], 5)).toEqual([]);
    expect(applyTwoStageSwipeFilter(null, [], 5)).toEqual([]);
    expect(applyTwoStageSwipeFilter(undefined, [], 5)).toEqual([]);
  });

  it('removes all disliked profiles regardless of how many remain', () => {
    const swipes = [
      swipe('A', 'dislike'),
      swipe('B', 'dislike'),
      swipe('C', 'dislike'),
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['D', 'E', 'F', 'G', 'H']);
  });

  it('skips stage 2 when stage 1 leaves <= targetCount results', () => {
    const swipes = [
      swipe('A', 'dislike'),
      swipe('B', 'dislike'),
      swipe('C', 'dislike'),
      swipe('D', 'dislike'),
      swipe('E', 'dislike'),
      swipe('F', 'dislike'),
      // remaining: G, H, I, J — only 4 left
      swipe('G', 'like'), // would be filtered out by stage 2 but stage 2 is skipped
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['G', 'H', 'I', 'J']);
  });

  it('returns exactly targetCount when stage 1 leaves exactly targetCount', () => {
    const swipes = [
      swipe('A', 'dislike'),
      swipe('B', 'dislike'),
      swipe('C', 'dislike'),
      swipe('D', 'dislike'),
      swipe('E', 'dislike'),
      // remaining: F, G, H, I, J = 5
      swipe('F', 'like'), // stage 2 must skip because we're at the floor
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['F', 'G', 'H', 'I', 'J']);
  });

  it('removes liked profiles when there are more than targetCount unliked candidates', () => {
    const swipes = [
      swipe('A', 'like'),
      swipe('C', 'like'),
      swipe('E', 'like'),
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['B', 'D', 'F', 'G', 'H']);
  });

  it('fills with the highest-ranked liked profiles when unliked count is below targetCount', () => {
    const swipes = [
      swipe('B', 'like'),
      swipe('D', 'like'),
      swipe('F', 'like'),
      swipe('G', 'like'),
      swipe('H', 'like'),
      swipe('I', 'like'),
      swipe('J', 'like'),
      // unliked: A, C, E (3 profiles)
      // liked: B, D, F, G, H, I, J (7 profiles)
      // need to fill 2 from liked; highest-ranked are B, D
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('returns top targetCount liked profiles when every candidate is liked', () => {
    const swipes = recommendations.map((r) => swipe(r.user_id, 'like'));
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('combines dislike and like filtering correctly', () => {
    const swipes = [
      swipe('A', 'dislike'),
      swipe('B', 'dislike'),
      swipe('C', 'like'),
      swipe('E', 'like'),
      swipe('G', 'like'),
      // after stage 1: C, D, E, F, G, H, I, J (8)
      // unliked: D, F, H, I, J (5) → matches floor exactly → no liked included
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['D', 'F', 'H', 'I', 'J']);
  });

  it('treats unknown swipe actions as neutral (not liked or disliked)', () => {
    const swipes = [
      swipe('A', 'super_like'),
      swipe('B', 'something_else'),
      swipe('C', null),
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('coerces non-string user IDs consistently with swipe IDs', () => {
    const numericRecs = [
      { user_id: 1, score: 0.9 },
      { user_id: 2, score: 0.85 },
      { user_id: 3, score: 0.8 },
      { user_id: 4, score: 0.75 },
      { user_id: 5, score: 0.7 },
      { user_id: 6, score: 0.65 },
      { user_id: 7, score: 0.6 },
      { user_id: 8, score: 0.55 },
    ];
    // Mix string vs numeric IDs in swipes to confirm both sides coerce equally.
    const swipes = [
      { swiped_id: '1', action: 'dislike' },
      { swiped_id: 2, action: 'like' },
    ];
    // Stage 1 drops user 1 → 7 left.
    // Stage 2: unliked = [3,4,5,6,7,8] (6), liked = [2] (1).
    // 6 unliked >= 5 floor → return top 5 unliked.
    const result = applyTwoStageSwipeFilter(numericRecs, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual([3, 4, 5, 6, 7]);
  });

  it('ignores swipes with empty or missing swiped_id', () => {
    const swipes = [
      { swiped_id: '', action: 'dislike' },
      { swiped_id: null, action: 'like' },
      { action: 'dislike' },
    ];
    const result = applyTwoStageSwipeFilter(recommendations, swipes, 5);
    expect(result.map((r) => r.user_id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});
