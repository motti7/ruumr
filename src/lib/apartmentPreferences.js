export const APARTMENT_LIFECYCLE = {
  TEAM_BUILDING: "TEAM_BUILDING",
  APARTMENT_RANKING: "APARTMENT_RANKING",
  APARTMENT_VIEWING: "APARTMENT_VIEWING",
  APARTMENT_FOUND: "APARTMENT_FOUND",
};

export const APARTMENT_PREFERENCES = ["amazing", "ok", "no_way"];

export const APARTMENT_PREFERENCE_POINTS = {
  amazing: 2,
  ok: 1,
};

export function preferencesAreComplete(apartments = [], preferences = {}) {
  if (!Array.isArray(apartments) || apartments.length === 0) return false;
  return apartments.every((apartment) => APARTMENT_PREFERENCES.includes(preferences?.[apartment.id]));
}

export function calculateApartmentPreferenceOutcome(apartments = [], preferencesByUser = {}) {
  const scores = apartments.map((apartment, index) => ({
    apartment_id: apartment.id,
    points: 0,
    amazing_votes: 0,
    ok_votes: 0,
    veto_user_ids: [],
    price: Number(apartment.price || 0),
    index,
  }));
  const byId = new Map(scores.map((score) => [score.apartment_id, score]));

  Object.values(preferencesByUser || {}).forEach((entry) => {
    const userId = String(entry?.user_id || "");
    const memberPreferences = entry?.preferences || {};
    Object.entries(memberPreferences).forEach(([apartmentId, preference]) => {
      const score = byId.get(apartmentId);
      if (!score) return;
      if (preference === "no_way") {
        score.veto_user_ids.push(userId);
        return;
      }
      score.points += APARTMENT_PREFERENCE_POINTS[preference] || 0;
      if (preference === "amazing") score.amazing_votes += 1;
      if (preference === "ok") score.ok_votes += 1;
    });
  });

  const rejectedByVeto = scores
    .filter((score) => score.veto_user_ids.length > 0)
    .map((score) => ({
      apartment_id: score.apartment_id,
      veto_user_ids: score.veto_user_ids,
      veto_count: score.veto_user_ids.length,
      price: score.price,
      index: score.index,
    }));

  const eligibleApartments = scores
    .filter((score) => score.veto_user_ids.length === 0)
    .sort((a, b) =>
      b.points - a.points
      || b.amazing_votes - a.amazing_votes
      || a.price - b.price
      || a.index - b.index
    );

  return {
    eligible_apartments: eligibleApartments,
    rejected_by_veto: rejectedByVeto,
    happiness_scores: scores,
    current_apartment:
      apartments.find((apartment) => apartment.id === eligibleApartments[0]?.apartment_id) || null,
    no_eligible_apartment: eligibleApartments.length === 0,
  };
}
