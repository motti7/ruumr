## October 31 update: independent sharing and boost

The sharing requirement has been removed in both UI and server. The blue sharing section is followed by an independent free-boost section. Native share delivery is not claimed or verified. Earlier deployment notes below are historical, not the current release status.

# Free profile boosts and retirement of paid Plus

## Behavior

- `/RuumrPlus` now offers a free 24-hour profile priority boost, claimable once every seven days.
- Sharing and boosting are independent. Sharing opens the device share sheet, falls back to clipboard, then to a selectable link. Sharing never claims a boost. The separate activation button requires no share action or assertion, and sharing remains available during cooldown or boost errors.
- Server timestamps and authenticated identity determine eligibility. The UI cannot choose an account, duration or cooldown. Repeated claims do not extend an existing boost. Concurrent claims can create duplicate rows, but ranking is a set of user IDs, so boosts never stack.
- Only visible, non-virtual roommate profiles qualify. Priority changes ordering only; visibility, blocks, preferences and previous swipe filters still apply. Matching still requires mutual likes. AI extraction of room listings is unchanged.
- Hebrew/English strings, live errors and localized dates follow the existing language toggle.

## Deployment is separate from source removal

This branch removes checkout/subscription screens, Stripe/RevenueCat packages, payment callbacks, entitlement grants, recommendation service integration and the old paid-Plus email campaign. It does not itself delete already-deployed Base44 resources or cancel a provider subscription.

Before publishing the replacement:

1. Inspect the existing `PendingSubscription` record marked active against the payment provider. The database label alone is not evidence of a recurring charge. Preserve payment history until this is resolved; do not erase it to make the dashboard look empty.
2. Deploy `ProfileBoost` and `profileBoosts`, including its `handler.js`, and the changed UI. Confirm with a test account that claiming works and direct entity writes are denied.
3. Remove deployed functions: `createCheckout`, `tranzilaWebhook`, `wix-payments-webhook`, `getSubscriptionStatus`, `cancelSubscription`, `activateRevenueCatPlus`, `revenueCatWebhook`, `ruumrPlusBridge`, `reconcileRuumrPlusProfiles`, `ensureBguPlusEntitlement`, `manageBguStudents`, `onProfileDeleted`, `sendNewsletterPreview`, `sendNewsletterBatch`. Do not assume deleting repository files deletes deployed functions. Retain a working cancellation route outside the app until any genuine provider subscriptions are settled.
4. Disable/remove the `Notify Ruumr Plus on Profile Deleted` workflow and any platform automation invoking removed functions, including any separately registered reconciliation schedule. Verify actual registrations in Base44, not just files.
5. Remove obsolete provider/AI-service secrets after callers are retired. Retire the separately deployed recommendation service and external payment webhooks, if configured.
6. Push the User schema without paid entitlement fields or stale required constraints. Match origins remain plain strings to keep existing conversations readable without paid privileges. The retired billing entity schema and its account-deletion dependency have been removed from source. Before deploying this account-deletion function, separately retire existing billing records in Base44 so account deletion cannot leave old personal billing data behind. Repository removal alone does not remove those records.
7. Build a fresh native app, sync native dependencies, and verify on-device login, share/cancel/confirm, Hebrew/English, mutual matching, chat, reporting and account deletion. Update App Store metadata/review notes to describe a free app. Source changes cannot alter an already-uploaded binary or guarantee review approval.

Production cleanup and native validation must be explicitly verified before this change is described as complete.

## Validation on this branch

- Production build passed. Changed JavaScript/JSX files pass ESLint.
- 16 targeted tests passed: server eligibility, self-attestation, cancellation, cooldown, ranking, bilingual errors and legacy chat display.
- Full suite: 140 passed, 8 failed. The same eight failures reproduce against the original main commit a06eb46 (layout-header, nativeAuth, GroupMessage, PageView, Review tests). They are not introduced by this branch.
- Mobile-width rendering checked in Hebrew and English with simulated backend responses: no page errors or horizontal overflow. Live Base44 invocation and native sharing still require branch testing.
- Owner reports the historical active billing record was probably a test. The connected Base44/Wix Payments dashboard showed no payments and zero subscriptions during the October 25–26 audit. This does not independently verify a separate Tranzila or RevenueCat account.

## Live retirement audit — October 26, 2026

- Disabled the actual `Notify Ruumr Plus on Profile Deleted` workflow in Base44, rather than relying on deletion of its repository file.
- Added a reversible early HTTP 410 return to main's `createCheckout`. Cancellation and historical billing records were preserved. Main checkpoint: `39280466915a9c2afbc8def03bc75a2ce4267854`.
- `Save & Redeploy` updated the editor version only. Published main without merging this feature branch; then an unauthenticated POST with `{}` to the public app's `createCheckout` endpoint returned HTTP 410 and `{"error":"paid_checkout_retired"}`. No payment transaction was created.
- Main still contains the old payment UI and remaining legacy resources. This is an interim checkout block, not completed removal or App Store readiness. The new free-boost UI remains on `codex/free-profile-boosts` (PR #23).
- Automatic approval review rejected broad deletion of production payment functions, including cancellation, before provider billing was verified. No bulk deletion was performed. Complete retirement requires resolving that approval and the remaining provider scope, then verifying the deployed removal and new branch behavior.

### Follow-up after explicit owner approval

- Owner explicitly confirmed there are no subscriptions and authorized removing all old billing functionality, including cancellation, on main.
- Published a removal-only release on main (`135e168`): removed purchase screens/routes, payment SDK dependencies, paid entitlement logic, and old AI recommendation integration. Preserved historical billing records and their account-deletion cleanup. The Plus navigation item is temporarily hidden and `/RuumrPlus` redirects to Discover. The free-boost feature remains on its separate branch.
- Production build passed; source scan found no retired payment providers/calls or paid entitlement flags in runtime code. Verified the live room feed and language toggle in Hebrew and English, with no paid Plus link. Verified the legacy Plus URL redirects to discovery.
- Base44's builder archived `Notify Ruumr Plus on Profile Deleted` through the platform workflow operation. Source-file deletion alone did not remove platform registrations; the connected tools cannot delete registered backend functions.
- To prevent retained registrations from executing old code, replaced all 14 retired endpoint bodies with the same dependency-free `endpoint_retired` HTTP 410 response. There are no SDK imports, data writes, email sends, external service calls or payment actions in these bodies. Published main at `716f7bfff3f65dbdb6c104d3060916629d34b50f`; the public `createCheckout` endpoint now returns `{"error":"endpoint_retired"}` / HTTP 410.
- Other retired endpoints were not invoked as a production test. Approval review rejected broad POST probes because old deployed webhooks/campaign endpoints could have side effects. Source bodies were checked instead. Physical removal of retained function names requires a platform API capability unavailable to the current connection; unused provider secrets and historical records have not been purged.
- Do not describe the above as a native-device acceptance test or guaranteed App Store approval. The free-boost branch still needs its live acceptance checks and a fresh native build.
