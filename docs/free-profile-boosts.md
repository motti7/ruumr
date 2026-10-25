# Free profile boosts and retirement of paid Plus

## Behavior

- `/RuumrPlus` now offers a free 24-hour profile priority boost, claimable once every seven days.
- Sharing uses the device share sheet, or copies the invitation where sharing is unavailable. The user must separately confirm they sent it. Cancelling the share sheet grants nothing. This is self-attestation, not verified delivery.
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
6. Push the User schema without paid entitlement fields or stale required constraints. Match origins remain plain strings to keep existing conversations readable without paid privileges. Historical billing records currently remain admin-only, with account-deletion cleanup retained.
7. Build a fresh native app, sync native dependencies, and verify on-device login, share/cancel/confirm, Hebrew/English, mutual matching, chat, reporting and account deletion. Update App Store metadata/review notes to describe a free app. Source changes cannot alter an already-uploaded binary or guarantee review approval.

Production cleanup and native validation must be explicitly verified before this change is described as complete.

## Validation on this branch

- Production build passed. Changed JavaScript/JSX files pass ESLint.
- 16 targeted tests passed: server eligibility, self-attestation, cancellation, cooldown, ranking, bilingual errors and legacy chat display.
- Full suite: 140 passed, 8 failed. The same eight failures reproduce against the original main commit a06eb46 (layout-header, nativeAuth, GroupMessage, PageView, Review tests). They are not introduced by this branch.
- Mobile-width rendering checked in Hebrew and English with simulated backend responses: no page errors or horizontal overflow. Live Base44 invocation and native sharing still require branch testing.
- Owner reports the historical active billing record was probably a test. Provider-side status remains unverified.
