# Public rooms and owner publication

The scraping pilot branch now supports /Rooms without sign-in. Guests at / or /Discover see rooms; the Partners tab goes to login. Other app routes remain protected and partner profiles are not mounted for guests. Only manually published RoomListing records are exposed by the public list action; raw imported posts and the AI lab remain admin-only.

The center navigation action becomes + in Rooms and AddRoom. Guests go to /register?next=AddRoom, with a matching login link. Email/OTP and provider login retain a fixed AddRoom destination. Account creation does not create a Profile; roommate onboarding is not part of room publication.

Authenticated owners upload 1–8 JPEG/PNG/WebP photos (up to 8MB each), enter city, address, monthly room price, dates, lease type, roommates, furniture, description and public phone, and confirm permission to publish. roomListings validates the request and sets owner_id from auth. Direct entity writes are denied. Owners can close their listings; account deletion removes their listings before proceeding. Data appears in Base44's existing RoomListing data table, not a separate admin dashboard.

Public list returns only explicit display fields. Signed-in blocks exclude owners in either direction, but public browsing is inherently available without identity. No scraping credentials, payment, account roles or Profile schema are changed.

Checks: node --test tests/room-listings.test.mjs; guest read, authenticated create without Profile, forged owner rejection, validation, close ownership and block filtering. Live anonymous function access depends on Base44 allowing the public app route and unauthenticated function invocation; verify this on deployment. Do not merge solely because local tests pass.
