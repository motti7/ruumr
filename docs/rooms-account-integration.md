# Rooms, accounts and messaging

Branch: `codex/scraping-ai-preview`. Keep this work on the review branch; do not merge automatically.

## Account and route rules

- `/` opens public rooms, irrespective of authentication. `/Rooms?room=ID` is a public shared listing link. The private scraping workspace remains admin-only.
- Anonymous visitors can browse/share and see a save prompt. Saving requires a real roommate Profile, enforced on the server.
- Room publication requires an account and RoomPublisher details, not a roommate Profile. RoomPublisher never enters the Profile entity/deck. Existing roommate accounts can add RoomPublisher details without another signup.
- The account icon opens Profile for roommates, RoomAccount for publisher-only accounts and login for guests. Roommate Profile links to publisher management; RoomAccount links back when a roommate Profile exists.
- RoomPublisher setup collects display name, optional photo and owner/departing-roommate role. Public listings contain those display fields only.
- Close changes listing status, never deletes User or RoomPublisher. A new room gets a new listing identity. Editing is restricted to the owner of a currently published listing. Old room offers retain their original snapshot.
- Saved rooms live in the header bookmark beside the account icon. Closed listings remain marked unavailable in saved lists.
- Matches/LikesYou links redirect to Inbox chats/likes. Room offers are separately filtered in Inbox and use RoomChat, not Match or reciprocal swipes.
- Rooms retain the center add button and a smaller Plus pill. Partners retain center Plus with no duplicate. Payment/AI product behavior is unchanged.

## Server and safety rules

New entities: RoomPublisher, RoomPreference, SavedRoom, RoomOffer, RoomOfferMessage. Their direct client writes are disabled and direct reads require admin. `roomHub` authorizes every request; bans and both directions of global UserBlock are applied. Offers require a published owned room and a visible accepting roommate. RoomOfferMessage sender IDs come from authentication. Reports target the verified counterpart.

Blocking persists the global block before deletion. The existing cleanup routine now drains room conversations as well as partner matches. Failed deletion remains cleanup_pending for the existing scheduled workflow. Account deletion drains the new account-owned data and room conversations, including saved references to deleted listings.

Room offers and messages use the existing server push helper and SendEmail, respecting notify_matches and enable_notifications. Delivery is best effort and logged separately from successful conversation creation. No notifications are sent by the local tests.

## Validation

Node tests cover authorization, roommate-only saves, ownership, opt-out, closed/hidden room offers, private conversations, reporting, block races and immutable offer snapshots. React tests cover save prompts for each account kind, switching languages and unavailable saved rooms. Existing scraping tests remain in the check set. Build and targeted lint are required before upload.

Deployment must include all new entities and roomHub together with the updated roomListings, userSafety and shared cleanup code. Verify actual branch function registration in Base44. Live phone push, delivered email, native signup return, multi-account chat and real account deletion require dedicated test accounts; never use real user records for destructive validation. Local mocks do not establish live delivery or live platform permissions.

All new UI requires Hebrew/English resources and RTL/LTR support. User-authored content is not automatically translated.
