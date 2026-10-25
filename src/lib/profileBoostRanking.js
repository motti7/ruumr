// Stable prioritization: never bypass visibility, block, region or preference filters.
export function prioritizeBoostedProfiles(profiles, boostedIds = []) {
 const ids = new Set(boostedIds);
 return [...profiles].sort((a, b) => Number(ids.has(b.user_id)) - Number(ids.has(a.user_id)));
}
