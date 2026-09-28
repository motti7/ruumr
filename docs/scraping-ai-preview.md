# Scraping AI preview — isolated pilot

Branch: `codex/scraping-ai-preview`. Primary entry: the main Discover page now has Partners / Rooms tabs. Open Rooms, or use `/Discover?view=rooms`. The embedded view starts empty for real JSON imports. The standalone lab at `/ScrapingPilot` remains accessible from the admin Settings link and starts with labelled invented examples. Import this branch using Base44's GitHub branch picker. Do not merge merely to test the UI. The standalone route is explicit in App.jsx because pages.config.js is generated; Base44 may also auto-register the page.

The existing partner deck stays mounted across tab switches, preserving swipe position. Rooms is lazy-loaded and stays mounted once opened to preserve unsaved imported posts during tab switches. The tab strip reserves 52px below the existing header; the deck's two top offsets are adjusted accordingly. The partners filter button is hidden on Rooms. Non-admin users see a coming-soon message in Rooms; raw posts, leads and processing controls require admin access at both UI and function levels.

This is an admin-only experiment, not a replacement management dashboard. New records live only in `ScrapingPilotPost`, visible to admins in Base44's built-in data dashboard. Existing profiles, rooms, messages and payments are not modified. No Facebook credentials, scraper calls, scheduled jobs, publication or outreach are implemented here.

## Try it

1. Open the main page's Rooms tab in the branch preview as an admin. It initially contains no posts. The optional demo button loads four INVENTED samples; their prepared fields are explicitly labelled, not presented as API results.
2. Export a JSON array from Apify and import it (max 100 rows / 1MB). Post text, canonical source link, date, group-city context, typed Photo attachment URLs and explicit Israeli phone numbers are retained. Author profile data and video thumbnails are discarded. Import stays in memory; there is no auto AI call or storage. Unsaved rows are lost on refresh or dataset replacement.
3. Select one post and click process. Base44's built-in InvokeLLM is available without a new provider key, charged against integration credits. Its underlying model is not selected or identified by this implementation. No web context or image inputs are sent.
4. Recommended candidate: `gpt-5.4-mini`, structured Responses API, reasoning none, max 2200 output tokens, no tool access, no retry, store:false. Enable it by configuring `OPENAI_API_KEY` in Base44 Secrets (never chat, frontend, repository, or browser storage). Status exposes only whether the key exists. The UI never silently substitutes a provider.
5. Review original vs extraction. Only target-city room offers and seekers can be saved explicitly. Saving a seeker does not contact anyone. Whole apartments, irrelevant ads and outside-city posts are excluded; ambiguity remains in review. Saving requires a real Facebook post URL and is forbidden for demo examples. Source URL hash makes sequential resaves update the same record; this pilot does not promise concurrency-safe uniqueness or semantic cross-post deduplication.
6. Saved results are always pending admin review, never publication-ready. Household policies need source evidence; do not infer personal religion. Group city is labelled as context, not independently verified geography.

## Platform checks still required after branch import

Verify Base44 deployed `scrapingPilot` and registered `ScrapingPilotPost` with admin-only read/delete and denied direct create/update (service role function writes only). The function independently checks auth.me().role === admin before every action. Branches can share real application data; this is why the pilot has a dedicated entity. If unavailable, ask the Base44 chat to check these exact resources on this branch without changing main or existing permissions. Do not assume a Git push proves resource deployment.

Test one real post with each available provider, save a room and a seeker, reload saved records, and verify an ordinary account gets 403 on direct function calls and cannot list the entity. No live authorization or model-quality verification is claimed by local tests.

## Cost and acceptance

Official model page checked 2026-09-27: https://developers.openai.com/api/docs/models/gpt-5.4-mini — $0.75/M input, $4.50/M output. At an illustrative 2,000 input + 700 output tokens per post, 1,000 posts cost about $4.65 for OpenAI only (excluding scraping, Base44 and taxes). Not a fixed quote; measure actual usage, including schema/prompt overhead, and evaluate Hebrew and sublet accuracy on labelled examples before final model selection. Built-in Base44 credits have separate pricing.

Tests: `node --test tests/scraping-pilot.test.mjs`. All initial fixture data is invented; never commit exported real posts, contact details, provider tokens or signed export links to this public repository.

## Media and processing feedback

Photo URLs use the observed Apify `Photo.image.uri` / `thumbnail` structure, deduplicate and allow only HTTPS fbcdn.net subdomains. The gallery shows load failures. These are temporary source URLs, not durable hosted assets: permanent storage and publication remain unimplemented. Room offers without photos or explicit phone numbers are marked unsuitable for publication, but may still be saved privately for diagnosis. A formatted phone is not proof it belongs to the advertiser. No OCR, outbound calls or WhatsApp messages are performed.

Processing shows feedback at the button, explains disabled empty-text posts, differentiates provider/validation/save failures, and reports a 90-second client timeout without retrying. The timeout does not cancel backend work. A built-in Base44 model call on an invented room post was verified successfully in the live branch on 2026-09-28 before these feedback changes; the reported failing user post was not available to reproduce.
