# RUUMR public-group collection pilot

Decision (2026-09-23): use Apify's own `apify/facebook-groups-scraper` for an initial collection-quality trial. This standalone Node 22 tool does not deploy to Base44, modify users, publish listings, create schedules, or invoke paid AI. It requires no additional npm packages.

## Budget and scope

- First trial: Free account, $5 monthly credit. Target at most 400 returned posts across a few manual runs; with the current date-filter rate ($7/1,000 on Free), that is about $2.80 plus starts/storage.
- If the trial passes: propose one month of Starter at $19, including $19 usage. Limit the pilot to 3,000 returned posts ($15 at the Starter date-filter rate), leaving headroom for starts/storage. Set an account usage limit in Apify before enabling recurring collection. This limit has NOT been configured by this code.
- Each explicit `start` requests an Apify run-charge cap of at most $1 and a 10-minute run timeout. This is not a monthly cap, nor a cap on dataset downloads/storage. Repeated starts spend additional credit. Set account limits as well.
- Public groups only; offered rooms in shared apartments in Tel Aviv, Jerusalem, Haifa and Beer Sheva. Whole apartments and people seeking rooms are out of scope. Regular rentals and sublets are separate; uncertain type remains unknown.
- Collection charges apply to returned posts, including irrelevant posts and repeat collection. The budget is for this collection trial, excluding taxes, existing subscriptions, future AI, hosting and production operation. No purchase is performed by this tool.

Current pricing: https://apify.com/pricing and https://apify.com/apify/facebook-groups-scraper/pricing . Provider prices may change. A successful run does not guarantee complete Facebook coverage. Apify is not Meta authorization; review rights to collect and republish before public rollout.

## Setup

Copy `groups.example.json` to `groups.local.json` in this directory. Add 1–8 groups the owner has selected, each as `{ "url": "https://www.facebook.com/groups/GROUP_ID", "city": "tel_aviv" }`. Valid cities: `tel_aviv`, `jerusalem`, `haifa`, `beer_sheva`. City on the group is context, never proof of a post's location. Verify each group is public manually.

Save an Apify token privately in `tools/room-pilot/.env.local` as `APIFY_TOKEN=...`. Do not send it in chat or commit it. Config, environment and output files are ignored in Git; the repository is public. Run from the repository root:

```sh
# Preview only: no credentials, network calls or spending
node tools/room-pilot/pilot.mjs preview tools/room-pilot/groups.local.json

# Explicitly start ONE capped run; record the printed run ID
node --env-file=tools/room-pilot/.env.local tools/room-pilot/pilot.mjs start tools/room-pilot/groups.local.json

# When Apify reports success, download that SAME run without starting another
node --env-file=tools/room-pilot/.env.local tools/room-pilot/pilot.mjs collect RUN_ID

# Alternatively import a JSON dataset exported manually from Apify
node tools/room-pilot/pilot.mjs import path/to/dataset.json

node --test tools/room-pilot/pilot.test.mjs
```

If start times out or loses its response, inspect Apify's Runs page and recover the run ID. Do not start again blindly: the first request may already have been charged. A running/failed/timed-out run is reported explicitly. Review results are saved under `output/`; no raw personal data is printed. The provider itself may retain additional collected fields in its dataset; configure retention and delete pilot datasets when no longer needed.

## What to review

This first increment measures collection, not extraction quality. All rows are `needs_review`; semantic fields intentionally remain null. Do not treat them as publishable cards. Author profiles and comments are not copied into the local review report. Post text can still contain personal information. IDs/URLs deduplicate within a report; cross-run and cross-post semantic deduplication are future work.

For a sample of at least 50 posts, manually label: offered shared room / room search / whole apartment / irrelevant; regular / sublet / unknown; city; rent and billing period; entry and end dates; roommate count; furnishing; explicitly stated household Shabbat policy. Record evidence text rather than infer sensitive traits. Keep both ambiguous and rejected examples for later extraction evaluation.

Compare against manually observed posts for the same groups and time window. Proposed acceptance: >=90% coverage of the visible sample, working source links and Hebrew text, no silently failed groups, and affordable cost per unique relevant room offer. A limit-saturated group needs another bounded test; do not claim full coverage. Record omissions per group, provider build ID, returned count, duplicate count, relevant unique count and console billing. `usageTotalUsd` is provider metadata, not a complete account invoice.

After collection is validated: implement evidence-based structured extraction and evaluate normal/sublet distinctions; add persistent deduplication and stale-listing expiry, then authenticated Base44 ingestion into a separate listing entity and an admin review queue. Only then add daily scheduling and production cards. Keep the provider behind an adapter so it can be replaced if Facebook coverage deteriorates.
