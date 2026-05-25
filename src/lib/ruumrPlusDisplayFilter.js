/**
 * Two-stage swipe filter for Ruumr Plus recommendations.
 *
 * Stage 1 removes every profile the user already disliked (no floor).
 * Stage 2 removes liked profiles only while at least `targetCount`
 * recommendations remain. If stage 1 already leaves ≤ targetCount, stage 2
 * is skipped entirely. When liked profiles must be kept to reach the floor,
 * the highest-ranked liked ones are preserved.
 *
 * @param {Array<{ user_id?: string | number, score?: number }>} recommendations
 * @param {Array<{ swiped_id?: string | number, action?: string }>} userSwipes
 * @param {number} targetCount
 * @returns {Array<object>}
 */
export function applyTwoStageSwipeFilter(recommendations = [], userSwipes = [], targetCount = 5) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const dislikedIds = new Set();
  const likedIds = new Set();

  if (Array.isArray(userSwipes)) {
    for (const swipe of userSwipes) {
      const swipedId = String(swipe?.swiped_id ?? "").trim();
      if (!swipedId) continue;
      if (swipe?.action === "like") {
        likedIds.add(swipedId);
      } else if (swipe?.action === "dislike") {
        dislikedIds.add(swipedId);
      }
    }
  }

  const afterDisliked = recommendations.filter(
    (rec) => !dislikedIds.has(String(rec?.user_id))
  );

  if (afterDisliked.length <= targetCount) {
    return afterDisliked;
  }

  const unliked = afterDisliked.filter((rec) => !likedIds.has(String(rec?.user_id)));
  const liked = afterDisliked.filter((rec) => likedIds.has(String(rec?.user_id)));

  if (unliked.length >= targetCount) {
    return unliked.slice(0, targetCount);
  }

  const filled = [...unliked, ...liked.slice(0, targetCount - unliked.length)];
  filled.sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));
  return filled;
}
