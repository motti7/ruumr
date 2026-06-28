# Ruumr Team State Machine + Apartment Preference Flow Plan

## Summary
Restructure Ruumr around lifecycle states: `TEAM_BUILDING`, `APARTMENT_RANKING`, `APARTMENT_VIEWING`, and `APARTMENT_FOUND`. Replace the current `3 / 2 / 1` ranking model with non-exclusive apartment ratings: `AMAZING`, `OK`, `NO_WAY`. Any `NO_WAY` veto rejects that apartment; among remaining apartments, maximize happiness with `AMAZING = 2`, `OK = 1`.

## Tracker
- Done: branch exists: `feature/team-apartment-discovery`.
- Done: initial apartment discovery entity/function prototype exists.
- Done: demo/simulator mode can show 3 mock apartments.
- Done: real users currently see "options are on the way," not mock apartments.
- Done: replaced `best / second / worst` ranking with `amazing / ok / no_way`.
- Done: added lifecycle fields and preference state to the apartment discovery schema.
- Done: added veto-plus-happiness scoring with tests for vetoes, happiness scoring, tie-breaks, and no-eligible results.
- Done: simulator mode has multiple mock batches and explicit demo-user markers.
- Done: added apartment-flow kill switch support with demo-user/simulator bypass.
- Done: state-aware home routing shows apartment flow after the team is complete.
- Done: added viewing and found states.
- Done: added lifecycle-aware bottom navigation for apartment states.
- Done: added rejection, choose, schedule, change-ratings, find-more, no-eligible, and no-more-suggestions paths.
- To add later: production apartment source integration.
- To add later: production-grade feature flag management UI.

## Backend And State Model
- Persist lifecycle state on the team apartment record:
  - `lifecycle_state`: `TEAM_BUILDING | APARTMENT_RANKING | APARTMENT_VIEWING | APARTMENT_FOUND`.
  - `suggestion_batch_index`, `current_apartment_index`, `exhausted_suggestions`.
  - `preferences`: map of user id to apartment ratings.
  - `eligible_apartments`, `rejected_by_veto`, `happiness_scores`, `current_apartment`, `selected_apartment`.
- Add feature gating:
  - Global kill switch, default off.
  - Per-user demo/allowlist flag, e.g. `is_apartment_flow_demo_user`.
  - Simulator mode always enables the flow and mock suggestions.
- Update `teamApartmentDiscovery` actions:
  - `ensure`: returns lifecycle state and creates apartment state after team completion when enabled.
  - `submit_preferences`: accepts `{ apartment_id: "amazing" | "ok" | "no_way" }` for all shown apartments.
  - `request_more_suggestions`: advances to next suggestion batch if available; stays in `APARTMENT_RANKING`.
  - `change_preferences`: clears/updates current user preferences while still in ranking mode.
  - `schedule_visit`, `reject_current_apartment(reason)`, `choose_current_apartment`.
- Selection algorithm:
  - Wait until all real team members submit preferences.
  - Reject any apartment with at least one `NO_WAY`.
  - Score remaining apartments with `AMAZING = 2`, `OK = 1`.
  - Tie-break by more `AMAZING` votes, then cheaper price, then deterministic order.
  - If no eligible apartment remains, keep lifecycle as `APARTMENT_RANKING` and return `no_eligible_apartment`.
- Suggestion sourcing:
  - Demo/simulator: maintain multiple mock batches of 3 apartments so "find three more" can be demonstrated.
  - Real users: no mock apartments; show pending/options-coming-soon until a real source exists.
  - If demo batches run out, return `no_more_suggestions`.

## Frontend Structure
- Add state-aware home experience:
  - `TEAM_BUILDING`: existing swipe/discover UI.
  - `APARTMENT_RANKING`: apartment preference UI or real-user pending state.
  - `APARTMENT_VIEWING`: current frontrunner apartment, schedule visit, choose/reject actions.
  - `APARTMENT_FOUND`: simple landing page saying the apartment is complete.
- Replace ranking controls with three independent rating choices per card:
  - English: `Amazing`, `Ok`, `No Way`.
  - Hebrew: natural equivalents, e.g. `מדהימה`, `סבבה`, `אין מצב`.
  - Multiple apartments can receive the same rating.
  - User must rate all 3 apartments before submitting.
- Add no-eligible-apartment state:
  - Explain that every apartment was rejected by at least one teammate.
  - Buttons: `Change my ratings` and `Find three more`.
  - If no more suggestions are available, show a clear "no more options right now" state.
- Update apartment viewing:
  - Show the selected top apartment.
  - Allow scheduling.
  - Buttons: `We chose this apartment` and `Not this one`.
  - Rejection reasons: not available anymore, too small, too far, too expensive, bad condition, other.
- Bottom nav in apartment states:
  - Team, Home, Plus, Chats, Map.
  - Plus stays centered and does nothing for now.
  - Map shows all current suggestions in ranking mode, only the frontrunner in viewing/found mode.

## Phased Execution
- Phase 1: Plan + flags + schema
  - Create `docs/team-state-machine-plan.md`.
  - Add lifecycle/preference fields and feature flags.
  - Update simulator backend for lifecycle and multiple mock suggestion batches.
- Phase 2: Preference algorithm
  - Replace Borda scoring with veto-plus-happiness scoring.
  - Add no-eligible and no-more-suggestions backend responses.
  - Add unit tests for vetoes, happiness scoring, ties, and exhausted batches.
- Phase 3: State-aware frontend
  - Add state-aware home shell.
  - Replace ranking UI with Amazing/Ok/No Way ratings.
  - Add no-eligible UI, change-ratings path, and find-more path.
- Phase 4: Viewing/found/navigation
  - Add viewing, choose/reject, found state, and map placeholder.
  - Add lifecycle-aware bottom nav.
  - Add confetti when team first transitions out of `TEAM_BUILDING`.
- Phase 5: QA
  - Verify English/Hebrew and RTL.
  - Verify web demo and iOS simulator demo.
  - Run i18n parity, targeted tests, build, and simulator sync/build.

## Test Plan
- Backend:
  - `NO_WAY` from any member disqualifies an apartment.
  - Happiness score maximizes among non-vetoed apartments.
  - Tie-breaks use Amazing count, cheaper price, deterministic order.
  - All apartments vetoed returns no-eligible state.
  - Find-more returns a new batch in demo; returns no-more when exhausted.
  - Real users without apartment source do not see mock suggestions.
- Frontend:
  - Rating buttons allow duplicate ratings across apartments.
  - Submit requires all 3 apartments rated.
  - No-eligible state offers change ratings and find more.
  - Viewing state shows only the selected frontrunner.
  - Found state shows chosen apartment.
  - Bottom nav changes correctly by lifecycle.
- Simulator/iOS:
  - Demo can complete rating, no-eligible, find-more, viewing, scheduling, rejection, and found paths.

## Assumptions
- Happiness scoring is `AMAZING = 2`, `OK = 1`, `NO_WAY = veto`.
- `NO_WAY` always rejects an apartment, even if everyone else marks it Amazing.
- "Find three more" is demo-only until a real apartment source exists.
- Real users remain gated behind global + per-user flags and never see mock listings.
