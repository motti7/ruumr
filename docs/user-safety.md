# Profile reports and private-chat blocking

## User behavior

- A report action is available in ProfileView and the expanded discovery profile. It never blocks or suspends a user automatically.
- A block action is available only in an existing private chat. Confirmation explains that the conversation and messages are permanently deleted for both participants and that there is no in-app undo.
- User accounts and profiles are not deleted. Reports are stored separately and survive chat deletion.
- Blocked pairs are omitted from discovery, received/sent likes, and the conversation list. Direct profile-page navigation is also filtered. This is not a promise to hide public profiles from every possible external API.
- Existing group conversations are unchanged. Plus recommendation generation and screens are unchanged; the shared private-message gateway still prevents a blocked pair from communicating if another feature creates a match record.

## Base44 dashboard

Use the built-in Data dashboard, without an additional administration page:

- `UserReport`: reporter ID, reported user ID, profile ID, reason, optional details and a server-created snapshot of public profile content. Administrators can change status (`new`, `in_review`, `resolved`, `dismissed`) and record `admin_notes`. These records are not accessible to ordinary users.
- `UserBlock`: pair identifiers and cleanup state. This is enforcement data, not an in-app block list. Do not delete these records as routine housekeeping: deleting a block removes its protection.
- Reporting does not send email or automatically suspend users. Administrators must review reports in Base44.

## Server enforcement and deletion

`userSafety` authenticates the caller and derives sender/participant identities server-side. Message creation, reading and read receipts go through this function. Entity policies deny direct client creation of Message/TypingStatus and restrict Message reads/updates to administrators. This prevents old or modified clients from bypassing block checks.

The permanent block is written before deletion. All matching conversations in both directions are collected, marked blocked, and drained of messages and typing signals before Match deletion. Reads and sends are denied even while cleanup is pending. Failed cleanup leaves `cleanup_pending=true` and returns an accurate pending result to the UI. `cleanupUserBlocks` retries pending work every ten minutes; configure the automation under an app administrator. Stored match IDs allow cleanup to retry after partial deletion. Deletion never touches UserReport or Profile.

Send checks membership and blocking both before and after creation; it compensates by deleting a message created during a concurrent block. Base44 operations are not transactional, so a send failure can still require the retained cleanup job to finish. Do not claim deletion is complete until cleanup is acknowledged. Already-delivered notifications or copies outside the app cannot be recalled.

Mutual swipe and team-match entry points check blocks. The notification worker suppresses messages for blocked pairs. There is no unblock API.

## Release requirements

These files are prepared for review; no production data was changed during development.

Deploy the new entities, functions, shared helper, cleanup automation, frontend, and Message/TypingStatus policies as one coordinated release. **Old installed clients that write/read Message directly will no longer work with the tightened policies.** Ship the updated native bundle or require users to upgrade; do not deploy just the policies while users still depend on the old client.

On an isolated Base44 app with disposable accounts, verify before rollout:

1. A reports B; only the administrator can read the report in the dashboard.
2. A and B chat while signed in on separate devices. A blocks B. Neither side can send, read the deleted conversation, or bypass the restriction with direct entity requests.
3. Unrelated C/D conversations and user profiles are untouched; report evidence remains.
4. An interrupted cleanup stays blocked, displays pending status, and is completed by the administrator-owned automation.
5. A new match row for the same pair cannot reopen private messaging; there is no in-app unblock option.
6. Check Hebrew/English and mobile dialogs, successful normal messaging, read receipts, typing cleanup and unread badges.

This does not deploy or merge the separate account-deletion change in PR #19.

## Automated validation

`node --test tests/userSafety.node.test.mjs` runs the server handler against isolated in-memory entities, including authorization, forged identities, pagination, duplicate matches, deletion failure/retry, concurrent sends, and data isolation.

`npx vitest run tests/components/UserSafety.test.jsx tests/lib/messageSchema.test.js tests/lib/typingStatusSchema.test.js` validates the confirmation/report UI and the new policy contract. These are not substitutes for Base44 permission enforcement tests on disposable accounts.

