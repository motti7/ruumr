# Ruumr Plus Questionnaire Service Implementation Prompt

Paste the prompt below into the `ruumr-plus-service` repository:

```text
Implement support for Ruumr lifestyle-questionnaire data in the existing ruumr-plus-service. Inspect the current profile ingestion, persistence, recommendation scoring, caching, response metadata, and tests before changing anything. Follow the existing architecture and conventions; do not replace the current algorithm wholesale.

Ruumr profile upserts and snapshots may now contain this optional field:

ruumr_plus_questionnaire: {
  version: 1,
  completed_at: ISO-8601 string,
  source: "legacy_import" | "match_questionnaire" | "plus_activation" | "plus_edit",
  source_match_id?: string,
  answers: {
    q_smoking: "a" | "b",
    q_partners: "a" | "b",
    q_pets: "a" | "b",
    q_cleaning_strictness: "a" | "b",
    q_shopping: "a" | "b",
    q_dishes: "a" | "b",
    q_ac: "a" | "b",
    q_hosting: "a" | "b"
  }
}

Requirements:
1. Extend profile validation, storage, upsert, snapshot, serialization, and migrations to preserve this optional object.
2. Treat the questionnaire as complete only when all eight canonical IDs contain "a" or "b". Invalid or partial data must not break profile ingestion.
3. Add a normalized questionnaire compatibility score when both requester and candidate have complete data.
4. Use agreement scoring with these internal topic weights:
   smoking 1.5, pets 1.5, cleanliness 1.25, partners 1.0,
   shopping 1.0, dishes 1.0, hosting 1.0, air conditioning 0.75.
5. Questionnaire compatibility contributes 20% of the final score. The existing algorithm contributes 80%.
6. When either profile lacks complete questionnaire data, omit this component and normalize the existing score to 100%; do not penalize missing data.
7. Questionnaire disagreements are soft ranking signals only. Do not introduce new hard exclusions.
8. Preserve all existing eligibility filters, swipe exclusions, entitlement checks, deterministic ordering, and recommendation limits.
9. Include backward-compatible recommendation metadata containing questionnaire score, jointly compared question count, agreements, and disagreements. Existing clients must continue working without reading it.
10. Invalidate or version recommendation caches whenever questionnaire data changes so stale scores are not served.
11. Add tests for full agreement, full disagreement, weighted mixed answers, missing or partial data, malformed input, snapshot ingestion, cache invalidation, and unchanged legacy scoring when questionnaire data is absent.
12. Document the new payload contract and the precise final-score formula.

Deploy this additive ingestion support before deploying the Ruumr client activation gate.

Return a concise implementation summary, migration notes, test results, and any additional deployment-order requirements.
```
