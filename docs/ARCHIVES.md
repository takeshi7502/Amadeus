# Amadeus Lab Archives

Open **Khám phá Amadeus / Explore Amadeus** in the chat sidebar or `/explore`.
The existing chat stays at `/`. No new environment variables or domain-specific
URLs are required.

## Pages

| Route | Behavior |
| --- | --- |
| `/explore` | Daily featured record/question, last-read record, saved records and the current role's local journal |
| `/archives` | Accent-insensitive title/summary search; type, adaptation and spoiler filters |
| `/archives/{slug}` | Bilingual Markdown, sources, contents, related records, bookmark and Kurisu reference chat |
| `/worldlines` | Eight narrative milestones, field filters, causes/consequences and side-by-side field comparison |
| `/characters` | 24 character files, a character selector and 46 selectable relationships |
| `/research` | Existing scenes, three reasoning exercises and a branching fictional D-mail experiment |
| `/editor` | Admin sign-in, bilingual drafts, image selection, preview, publication, unpublication and JSON export |

The baseline contains **54 original bilingual summaries**, including **24 people,
11 organizations/groups and 46 character relationships**. See
[the anime roster](ANIME_ROSTER.md) for the complete bundled inventory, aliases,
episode locators and coverage boundaries. The roster covers the plot-relevant
cast of the Steins;Gate TV anime, episode 23β and Steins;Gate 0 TV anime. Two
causally important unnamed relatives have explicit unnamed records; aliases do
not count as additional people. Organizations include institutions, factions,
story-relevant businesses and one clearly labeled editorial umbrella for Russian
forces rather than an invented official agency.

Editorial interpretation is labeled separately. Episode locators specify the
adaptation/episodes to consult; a linked series landing page is an overview,
not a transcript or proof of each detail. Sources include the official KADOKAWA
TV overview and Steins;Gate 0 anime site, with secondary character references
where relevant. This set does not exhaust the film, OVAs, visual-novel routes or
the wider Science Adventure franchise. Adaptation differences are called out
instead of silently importing VN-only events.

The five initial spoiler-free biographies retain their stable URLs; separate
journey records cover their later plot developments. At full spoilers the graph
centers the selected person and displays up to eight direct neighbors to keep
labels readable. The adjacent relationship list is complete, and the selector
and character cards reach every available person. Spoiler filtering applies to
the profiles, selector and relationships together.

The world-line map uses **narrative order**, not a universal calendar, exhaustive
world-line graph or multiple simultaneously active universes. Research outcomes
and scenes are original fiction, not canonical events.

## Implementation and storage

- `archive_seed.py`: source-controlled baseline, timeline and relationships.
- `archive_anime.py`: bilingual anime roster expansion and core biography updates.
- `archives.py`: strict schemas, public read API and protected editorial API.
- `explorer.html/css/js`: separate client using the chat's local fonts, palette,
  night preference and safe Markdown renderer. Article bodies load on demand;
  the public index transfers metadata only.
- `archive_pages`: additive SQLite/Turso table, automatically created at startup.
  Each edited slug stores separate draft/published JSON, visibility, revision and
  timestamp. Existing conversations are not migrated or rewritten.

Saving a draft leaves the published snapshot unchanged. Publishing copies the
validated draft into that snapshot. Unpublishing also hides a bundled baseline;
the retained draft can be published again. There is no hard-delete endpoint.
The initial limit is 500 edited records, with bounded text and source fields.
Every mutation checks the expected revision within a database transaction. Stale
tabs receive HTTP 409 and keep their typed content. If publishing fails after
the draft save, that draft remains saved and the public version stays unchanged.
Related slugs must exist at publication; self-links are rejected.

Use **Export records** for an offline JSON copy before bulk edits. It exports
saved drafts and revisions, not unsaved form text. Import and a full revision
history are not included in this release. Images can be selected from bundled
character portraits and the existing Amadeus logo; arbitrary URLs and uploads
remain disabled. See [character image credits](CHARACTER_IMAGES.md).

Bookmarks, last-read slug and journals remain on the browser and are namespaced
by guest/admin. Preferences are local; they are not cloud-synced. The journal is
displayed without copying it into the archive database or automatically sending
it to AI. Corrupt local values are preserved rather than silently overwritten.

## Kurisu reference chat

Opening the companion does not create a session or call AI. Send creates one
ordinary Amadeus session, reused until the companion closes or changes topic.
Sessions appear in the existing main chat history. Guests use the browser's
`AmadeusGuestStore`; only completed turns are committed locally. Admin uses the
existing authenticated session/database APIs. The full-chat link opens the
active session on the main page.

The client sends only `archive_slug`. The server resolves the current published
record, requires `ai_reference`, chooses the turn's VI/EN content and attaches it
as explicitly untrusted user-level reference data. It is never inserted as
system instructions or treated as Kurisu's direct personal memory. Hidden/draft
records are excluded. This reference is selected on each send; ordinary chat's
existing canon retrieval remains unchanged. The spoiler filter is a browsing
preference, not an authorization boundary for AI requests.

## Security and operations

Editorial reads/writes reuse the signed HttpOnly admin cookie and server-side
owner dependency. Drafts and configuration secrets never enter the public index.
Logout, cross-tab auth events and focus checks clear private form/chat DOM. Late
responses cannot repopulate a new workspace or trigger a follow-up publication
after an auth change. Form text is retained on network/validation/conflict errors.

Existing same-origin and Fetch Metadata checks protect mutations. Middleware
also bounds the actual request stream, including chunked bodies, instead of
trusting Content-Length: 128 KiB editorial / 256 KiB guest messages / 64 KB other
writes. Validation errors name fields without echoing passwords or rejected
document bodies. Editorial writes reuse the existing rate limiter.

SQL values use parameters. Schemas reject extra fields, arbitrary image URLs and
non-HTTPS source links. Source URLs are links only; the server never fetches them.
Raw HTML and remote Markdown images stay disabled; links are protocol checked
and the existing strict CSP stays enabled. Mobile companion overlays trap focus
and make the covered page inert; desktop remains a nonmodal reference panel.

These checks are not an external security audit. The existing guest AI limiter
is per process; a deployment with many instances should also use provider budget
limits and deployment-level traffic controls.

## Verification

Test helpers remain in ignored `.local/`. API coverage runs against SQLite and a
mock Turso/Hrana transport: public filtering, draft isolation, auth/CSRF, revision
conflicts, failed-publication rollback, URL/image validation, AI locale/reference
permissions, actual body limits and validation redaction. Browser coverage checks
navigation/search, language, safe Markdown, role isolation, bookmarks, research,
companion storage and editor conflicts.

Build with `python tools/prepare_vercel.py`; this only prepares local assets.
Explicit FastAPI page routes support direct links/reloads and leave unknown API
or static URLs as proper 404s. No deployment is performed by these changes.
