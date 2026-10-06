# CreatorOS YouTube publishing

Publishing is an explicit action after approval. An approval never creates a job.

## Setup

Use the existing persistent Express backend, PostgreSQL database, Clerk authentication, and B2 bucket. No separate queue service is required. Run the frontend and backend with their existing `npm run dev` commands; production uses `npm run build` and `npm start` in each directory.

Add to `backend/.env` (never commit values):

| Variable | Value |
| --- | --- |
| `OAUTH_STATE_SECRET` | At least 32 random bytes, encoded as a string; independent of the encryption key |
| `INTEGRATION_TOKEN_ENCRYPTION_KEY` | Exactly 32 random bytes encoded as base64 |
| `PUBLISH_WORKER_INTERVAL_MS` | Optional; defaults to `15000`, minimum `1000` |

Keep the existing `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, `DATABASE_URL`, `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_REGION`, `B2_KEY_ID`, and `B2_APPLICATION_KEY` configured. The example is in `backend/.env.example`. All backend instances must share the same state/encryption keys. Preserve the encryption key through restarts; replacing it makes existing credentials and resumable sessions unreadable.

The frontend optionally accepts `NEXT_PUBLIC_API_URL`; it defaults to `http://localhost:5000`. Use `FRONTEND_URL=http://localhost:3000` locally. In production use HTTPS and same-site frontend/backend domains, such as `app.example.com` and `api.example.com`, so the HttpOnly OAuth browser-binding cookie works. Credentialed CORS is limited to integration routes and allowed frontend origins; other API CORS behavior is unchanged.

Manual Google Cloud setup:

1. Configure the OAuth consent screen, External audience, and Testing mode during development.
2. Add the YouTube account as a Test User.
3. Enable YouTube Data API v3.
4. Use a Web application OAuth client.
5. Register an authorized redirect URI exactly matching `GOOGLE_REDIRECT_URI`, including scheme, host, port, and `/api/integrations/youtube/callback`.
6. Allow `youtube.upload` and `youtube.readonly`. Upload is used for videos; readonly is used for owned channel identification and private-video status reconciliation. No other Google scopes are requested.

External apps in Testing can have short-lived refresh-token grants. Reconnect the same channel if Google revokes or expires the grant. Certain unaudited API projects have uploads restricted to private visibility, so successful upload does not prove scheduled public publication. Complete Google's required YouTube API audit/verification before relying on public release. CreatorOS does not bypass this restriction.

References: [server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [YouTube scopes](https://developers.google.com/identity/protocols/oauth2/scopes#youtube), [videos.insert restrictions](https://developers.google.com/youtube/v3/docs/videos/insert), [resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol), [video status and publishAt](https://developers.google.com/youtube/v3/docs/videos), [channels.list](https://developers.google.com/youtube/v3/docs/channels/list), [videos.list](https://developers.google.com/youtube/v3/docs/videos/list).

## Database

Use Prisma Next, from `backend/`:

```sh
npx prisma contract emit
npx prisma db update --dry-run
npx prisma db update
npx prisma db verify
```

The migration was applied to the configured database after checking it contained zero existing PublishJob rows. Prisma classifies replacing the status check constraint and making scheduledAt required as consent-requiring operations. The reviewed migration was applied with `--confirm neondb`. On another database, inspect existing rows before consenting: old jobs need a real approved asset, integration, metadata, and future schedule; do not invent those values or delete jobs. Existing duplicate Integration provider rows must be resolved before adding the unique key. Do not use `db push` or `db init`.

Schema changes:

- `PublishStatus`: added `SCHEDULED` between `UPLOADING` and `PUBLISHED`.
- `PublishJob`: required `assetId`, `integrationId`, `title`, `tags`, and `scheduledAt`; `publishStatus` defaults to `QUEUED`; added optional `description`, `uploadedAt`, `externalVideoUrl`; added booleans `selfDeclaredMadeForKids` and `containsSyntheticMedia` (false), and `attemptCount` (0).
- Recovery fields: encrypted nullable `uploadSession`, nullable `uploadSize`, and `retryAllowed` (true). They preserve the upload destination across crashes. Session and size are not returned by the API.
- Relations: job belongs to the exact Asset and Integration; both have reverse `publishJobs` relations. Added schedule and asset/integration indexes; retained existing status indexes.
- `Integration`: unique `(userId, provider)`, reverse jobs relation. Disconnect deactivates credentials rather than deleting referenced history.
- Contract JSON/types and Prisma's database reference and snapshot were regenerated.

## APIs

All responses use the existing `status/message/data.responseData` envelope. Lists also provide `totalCount`, `totalPages`, and `currentPage`. All routes except the Google callback use both Clerk authentication and `currentUserMiddleware`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/integrations/youtube/connect` | Return Google authorization URL and set HttpOnly flow cookie |
| GET | `/api/integrations/youtube/callback` | Validate signed state, browser nonce and PKCE; exchange code; redirect to Settings |
| GET | `/api/integrations/youtube/status` | Safe connection/channel metadata only |
| DELETE | `/api/integrations/youtube` | Clear credentials, stop queued jobs, update UserSettings, best-effort revoke |
| POST | `/api/publish-jobs` | Validate approved asset and create scheduled snapshot |
| GET | `/api/publish-jobs` | Owned jobs; `pageNo`, `pageSize`, `status`, optional `contentId` |
| GET | `/api/publish-jobs/:publishJobId` | Owned job detail |
| POST | `/api/publish-jobs/:publishJobId/retry` | Revalidate failed job and queue a safe retry |

Creation accepts only `contentId`, `assetId`, `title`, optional `description`, `tags: string[]`, and explicit booleans `selfDeclaredMadeForKids` and `containsSyntheticMedia`. User identity, platform, integration, and schedule are derived server-side. Unknown fields are rejected. Invalid requests return 400, inaccessible jobs/content 404, and invalid publishing states 409.

## OAuth and security

Connect produces HMAC-signed state containing user identity, random nonce, issuance and ten-minute expiry. The nonce is bound to an HttpOnly browser cookie and stored in Integration metadata. Callback consumes the nonce under a database user-row lock before exchanging the code; repeated callbacks cannot reuse it. PKCE binds the code to the server. Pending-flow metadata also prevents a concurrent disconnect or newer connect from being overwritten by an older callback.

Tokens and upload session URLs use AES-256-GCM with random IVs and authentication tags. Tokens are never returned to clients or logged. Reconnection preserves an existing refresh token when Google omits a new one. A channel with existing publishing jobs cannot silently be replaced with another channel. Redirects use the configured frontend URL only; they contain only `youtube=connected` or `youtube=error`.

Ownership resolves through Project.ownerId using the database user ID. Asset/workflow/content relationships, completed video generation, undeleted resources, exact asset approval, YouTube provider/ownership, and future schedule are checked on creation and again before uploading. The client cannot supply storage keys or a destination integration.

## Worker and retries

`server.ts` starts `startPublishWorker()` after listen. The worker schedules one polling cycle at a time and processes queued jobs immediately, before their publication time. `stopPublishWorker()` drains the current cycle on SIGINT/SIGTERM. Keep the backend running; request-only/serverless deployments cannot run this polling worker reliably.

Creation/retry/disconnect serialize on the same user row, and content validation uses the existing project/content locks. Workers atomically update `QUEUED → UPLOADING` with a conditional PostgreSQL UPDATE/RETURNING and increment attempts. Only the winning worker uploads.

The worker refreshes OAuth credentials, reads the exact B2 object as a Node stream, initializes YouTube's official resumable `videos.insert` request with `privacyStatus=private` and `publishAt=scheduledAt`, and persists the encrypted session before sending video bytes. It streams without buffering the entire file or creating permanent files. An interrupted retry queries that same session and either recovers the video ID or resumes from YouTube's confirmed byte offset.

Successful upload records the video ID/URL and uploadedAt, then transitions to SCHEDULED. After the scheduled time, reconciliation checks actual YouTube visibility at most once per five minutes per job; only confirmed public videos become PUBLISHED. Private/missing/unconfirmed videos retain SCHEDULED with a useful message. Rejected/processing-failed videos become non-retryable FAILED.

Failures are persisted with safe messages. UPLOADING jobs older than twenty minutes become FAILED; upload requests have ten-minute deadlines. Retry refreshes credentials and revalidates ownership, approval, integration, duplicates, and schedule. Before a resumable session exists, retry can snapshot a newly edited Content schedule. Once a session exists, its schedule is immutable: an expired schedule cannot be silently changed or uploaded immediately. Review that session in YouTube Studio. Expired/ambiguous upload sessions disable retry to avoid duplicate uploads; manual inspection is required. No exactly-once guarantee across an external API and PostgreSQL is claimed.

Disconnect refuses during an active upload. Queued jobs become FAILED. Already-uploaded YouTube videos remain uploaded and can still publish; manage those in YouTube Studio. Reconnect the original channel to restore reconciliation.

## Manual end-to-end check

1. Configure environment and Google settings above; start frontend and backend.
2. Sign in, open Settings, choose Connect YouTube, and consent to both YouTube permissions using a Test User. Confirm the correct channel title appears.
3. Generate a vertical MP4 through the existing content workflow. Check B2 playback in Approvals. Approve it; verify no publication starts automatically.
4. Edit that Content Idea's scheduled date to a future time allowing upload/processing (for a development check, allow at least 15–30 minutes).
5. In Approved, choose Schedule on YouTube. Confirm title, description and tags; explicitly choose audience and synthetic-media declaration; submit.
6. Open Publishing. Observe QUEUED, UPLOADING and SCHEDULED; verify the URL and increasing attempt count. A second submission for the same video must return a conflict.
7. Open YouTube Studio using the same channel. Verify the uploaded video, metadata, private visibility, scheduled timestamp, and declarations.
8. Keep the backend running past that time. Verify public visibility on YouTube; then check PUBLISHED in CreatorOS. If the API project is restricted, expect SCHEDULED with a visibility message, not a false success.
9. Test a missing/past content schedule, an unapproved asset, and another user's content: each must be rejected. Confirm other users cannot read the job.
10. Simulate storage/auth failure in a development environment, observe FAILED, fix it, then Retry before the snapshot schedule. Verify interrupted uploads reuse the existing session and do not create duplicates.
11. Disconnect in Settings. Verify status/settings are disconnected and queued jobs stop. Confirm already-scheduled YouTube videos remain visible in Studio; reconnect the same channel if desired.
12. Smoke-test sign-in, Projects CRUD, Content CRUD/scheduling, Project Settings, script/video generation, playback, and approve/reject/regenerate. Automated approval tests cover service regressions; real providers need this manual check.

## Automated verification

`cd backend && npm test` builds and runs the existing approval service tests plus mocked publishing tests using Node's built-in test runner. No test performs a real OAuth exchange or upload. Frontend checks: `npx next typegen`, `npx tsc --noEmit`, `npm run lint -- src`, and `npm run build`.

Only `googleapis` was added as a direct runtime dependency. Existing `undici` streams the resumable media request; Node crypto encrypts secrets; existing Zod, React Hook Form, TanStack Query, Axios, and UI components implement the frontend.
