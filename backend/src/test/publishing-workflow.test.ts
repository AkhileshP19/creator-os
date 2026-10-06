import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { Temporal } from "temporal-polyfill";
import { auth } from "googleapis/build/src/apis/youtube/index.js";
import {
  createOAuthState,
  verifyOAuthState,
  encryptToken,
  decryptToken,
  metadataObject,
  safePublishError,
} from "../services/publish-security.js";
import {
  createPublishJobSchema,
  oauthCallbackSchema,
} from "../schema/validation-schemas/publish-validation.js";
import type { WorkflowTransaction } from "../services/video-review-service.js";

process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.OAUTH_STATE_SECRET = "test-state-secret-at-least-32-bytes-long";
process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
  "base64",
);
process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
process.env.GOOGLE_REDIRECT_URI =
  "http://localhost:5000/api/integrations/youtube/callback";
const { db } = await import("../prisma/db.js");
const { publishService } = await import("../services/publish-service.js");
const { integrationService } =
  await import("../services/integration-service.js");
const { youtubePublishService } =
  await import("../services/youtube-publish-service.js");
const { b2PublishingStorage } =
  await import("../services/b2-storage-service.js");
const { claimPublishJob, processPublishJob, reconcilePublishJob } =
  await import("../services/publish-worker-service.js");
afterEach(() => mock.restoreAll());
type Row = Record<string, unknown>;
const now = Temporal.Now.instant();
const input = {
  contentId: "content",
  assetId: "video",
  title: "Snapshot title",
  description: "Description",
  tags: ["shorts"],
  selfDeclaredMadeForKids: false,
  containsSyntheticMedia: true,
};
function fixture() {
  const data: Record<string, Row[]> = {
    User: [{ id: "owner", deletedAt: null }],
    Project: [{ id: "project", ownerId: "owner", deletedAt: null }],
    ContentIdea: [
      {
        id: "content",
        projectId: "project",
        deletedAt: null,
        scheduledDate: now.add({ hours: 2 }),
      },
    ],
    AIWorkflow: [{ id: "workflow", contentId: "content", status: "COMPLETED" }],
    Asset: [
      {
        id: "video",
        workflowId: "workflow",
        assetType: "VIDEO",
        deletedAt: null,
        storageUrl: "video.mp4",
      },
    ],
    Approval: [
      {
        id: "approval",
        contentId: "content",
        assetId: "video",
        decision: "APPROVED",
      },
    ],
    Integration: [
      {
        id: "integration",
        userId: "owner",
        provider: "YOUTUBE",
        accessToken: encryptToken("access"),
        refreshToken: encryptToken("refresh"),
        metadata: { channelId: "channel" },
      },
    ],
    UserSettings: [{ id: "settings", userId: "owner", youtubeConnected: true }],
    PublishJob: [],
  };
  let serial = 0;
  function collection(
    name: string,
    predicates: ((row: Row) => boolean)[] = [],
  ) {
    const rows = () =>
      data[name]!.filter((row) => predicates.every((p) => p(row)));
    return {
      where(condition: Row) {
        return collection(name, [
          ...predicates,
          (row) =>
            Object.entries(condition).every(
              ([key, value]) => row[key] === value,
            ),
        ]);
      },
      async first() {
        return rows()[0] ? { ...rows()[0] } : null;
      },
      async all() {
        return rows().map((row) => ({ ...row }));
      },
      async create(values: Row) {
        const row = {
          id: `job-${++serial}`,
          createdAt: now,
          updatedAt: now,
          attemptCount: 0,
          retryAllowed: true,
          uploadSession: null,
          uploadSize: null,
          externalVideoId: null,
          ...values,
        };
        data[name]!.push(row);
        return { ...row };
      },
      async update(values: Row) {
        const selected = rows();
        for (const row of selected) Object.assign(row, values);
        return selected;
      },
    };
  }
  const tx = {
    orm: {
      public: Object.fromEntries(
        Object.keys(data).map((name) => [name, collection(name)]),
      ),
    },
    async query(plan: unknown) {
      const ast = metadataObject(metadataObject(plan).ast);
      const parts = Array.isArray(ast.parts) ? ast.parts : [];
      const params = parts
        .filter((p) => metadataObject(p).value !== undefined)
        .map((p) => metadataObject(p).value);
      const sql = parts.filter((p) => typeof p === "string").join("");
      if (sql.includes('UPDATE public."publishJob"')) {
        const job = data.PublishJob!.find(
          (row) => row.id === params[0] && row.publishStatus === "QUEUED",
        );
        if (!job) return [];
        job.publishStatus = "UPLOADING";
        job.attemptCount = Number(job.attemptCount) + 1;
        return [{ id: job.id }];
      }
      if (sql.includes('public."user"'))
        return data
          .User!.filter((row) => row.id === params[0] && row.deletedAt === null)
          .map((row) => ({ id: row.id }));
      const content = data.ContentIdea!.find(
        (row) => row.id === params[0] && row.deletedAt === null,
      );
      const project = data.Project!.find(
        (row) =>
          row.id === content?.projectId &&
          row.ownerId === params[1] &&
          row.deletedAt === null,
      );
      return content && project ? [{ id: content.id }] : [];
    },
  } as unknown as WorkflowTransaction;
  mock.method(
    db,
    "transaction",
    async (fn: (value: WorkflowTransaction) => Promise<unknown>) => fn(tx),
  );
  for (const name of ["PublishJob", "Integration"] as const) {
    mock.method(db.orm.public[name], "where", (condition: Row) =>
      collection(name).where(condition),
    );
  }
  return { data, row: (name: string) => data[name]![0]! };
}
const status = (code: number) => (error: unknown) =>
  metadataObject(error).statusCode === code;

test("signed OAuth state rejects tampering and expiration", () => {
  const { state } = createOAuthState("owner");
  assert.equal(verifyOAuthState(state).userId, "owner");
  assert.throws(() => verifyOAuthState(`${state}x`));
  const time = Date.now();
  mock.method(Date, "now", () => time + 700_000);
  assert.throws(() => verifyOAuthState(state), /Expired/);
});
test("tokens use authenticated encryption and errors never expose tokens", () => {
  const encrypted = encryptToken("super-secret");
  assert.ok(!encrypted.includes("super-secret"));
  assert.equal(decryptToken(encrypted), "super-secret");
  assert.throws(() => decryptToken(encrypted.slice(0, -4) + "AAAA"));
  assert.ok(
    !safePublishError(new Error("super-secret")).includes("super-secret"),
  );
});
test("schemas reject missing code, ownership inputs, invalid metadata and declarations", () => {
  assert.equal(
    oauthCallbackSchema.safeParse({ state: "state" }).success,
    false,
  );
  assert.equal(
    createPublishJobSchema.safeParse({ ...input, userId: "attacker" }).success,
    false,
  );
  assert.equal(
    createPublishJobSchema.safeParse({
      ...input,
      selfDeclaredMadeForKids: "false",
    }).success,
    false,
  );
  assert.equal(
    createPublishJobSchema.safeParse({ ...input, title: "" }).success,
    false,
  );
});
test("connect URL requests offline access, minimal scopes and PKCE", async () => {
  fixture();
  const result = await integrationService.connect("owner");
  const url = new URL(result.authorizationUrl);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("scope")?.split(" ").length, 2);
});
test("callback consumes state before a token-exchange failure and rejects replay", async () => {
  fixture();
  const result = await integrationService.connect("owner");
  const state = new URL(result.authorizationUrl).searchParams.get("state")!;
  mock.method(auth.OAuth2.prototype, "getToken", async () => {
    throw new Error("exchange failed");
  });
  await assert.rejects(
    integrationService.callback(state, "code"),
    /exchange failed/,
  );
  await assert.rejects(
    integrationService.callback(state, "code"),
    /already used/,
  );
});
test("valid callback preserves the existing refresh token when Google omits it", async () => {
  const f = fixture();
  const refresh = f.row("Integration").refreshToken;
  const result = await integrationService.connect("owner");
  const state = new URL(result.authorizationUrl).searchParams.get("state")!;
  mock.method(auth.OAuth2.prototype, "getToken", async () => ({
    tokens: {
      access_token: "new-access",
      scope:
        "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    },
  }));
  mock.method(auth.OAuth2.prototype, "request", async () => ({
    data: { items: [{ id: "channel", snippet: { title: "Test channel" } }] },
  }));
  await integrationService.callback(state, "code");
  assert.equal(f.row("Integration").refreshToken, refresh);
  assert.equal(
    decryptToken(String(f.row("Integration").accessToken)),
    "new-access",
  );
  assert.equal(f.row("UserSettings").youtubeConnected, true);
});
test("disconnect removes credentials and deactivates settings even if revocation fails", async () => {
  const f = fixture();
  mock.method(auth.OAuth2.prototype, "revokeToken", async () => {
    throw new Error("offline");
  });
  await integrationService.disconnect("owner");
  assert.equal(f.row("Integration").refreshToken, null);
  assert.equal(f.row("Integration").accessToken, "");
  assert.equal(f.row("UserSettings").youtubeConnected, false);
  assert.equal((await integrationService.status("owner")).connected, false);
});
test("approved video creates an immutable QUEUED snapshot and duplicate creation conflicts", async () => {
  const f = fixture();
  const job = await publishService.create("owner", input);
  assert.equal(job.publishStatus, "QUEUED");
  assert.equal(job.assetId, "video");
  assert.equal(job.integrationId, "integration");
  f.row("ContentIdea").title = "Changed later";
  assert.equal(job.title, "Snapshot title");
  assert.ok(!("uploadSession" in job));
  await assert.rejects(publishService.create("owner", input), status(409));
});
for (const [name, mutate, expected] of [
  [
    "unapproved",
    (f: ReturnType<typeof fixture>) => {
      f.row("Approval").decision = "PENDING";
    },
    409,
  ],
  [
    "other owner's content",
    (f: ReturnType<typeof fixture>) => {
      f.row("Project").ownerId = "other";
    },
    404,
  ],
  [
    "other content's asset",
    (f: ReturnType<typeof fixture>) => {
      f.row("AIWorkflow").contentId = "other";
    },
    404,
  ],
  [
    "missing integration",
    (f: ReturnType<typeof fixture>) => {
      f.data.Integration = [];
    },
    409,
  ],
  [
    "past schedule",
    (f: ReturnType<typeof fixture>) => {
      f.row("ContentIdea").scheduledDate = now.subtract({ hours: 1 });
    },
    409,
  ],
  [
    "missing schedule",
    (f: ReturnType<typeof fixture>) => {
      f.row("ContentIdea").scheduledDate = null;
    },
    409,
  ],
  [
    "deleted video",
    (f: ReturnType<typeof fixture>) => {
      f.row("Asset").deletedAt = now;
    },
    409,
  ],
] as const)
  test(`publishing rejects ${name}`, async () => {
    const f = fixture();
    mutate(f);
    await assert.rejects(
      publishService.create("owner", input),
      status(expected),
    );
  });
test("atomic conditional claim allows only one worker", async () => {
  fixture();
  const job = await publishService.create("owner", input);
  const claims = await Promise.all([
    claimPublishJob(job.id),
    claimPublishJob(job.id),
  ]);
  assert.equal(claims.filter(Boolean).length, 1);
});
test("successful upload records SCHEDULED without falsely publishing", async () => {
  const f = fixture();
  const job = await publishService.create("owner", input);
  mock.method(youtubePublishService, "upload", async () => "youtube-id");
  await processPublishJob(job.id);
  assert.equal(f.row("PublishJob").publishStatus, "SCHEDULED");
  assert.equal(f.row("PublishJob").attemptCount, 1);
  assert.equal(f.row("PublishJob").externalVideoId, "youtube-id");
});
for (const reason of [
  "B2 missing",
  "Google upload failure",
  "Token refresh failure",
])
  test(`${reason} persists FAILED safely`, async () => {
    const f = fixture();
    const job = await publishService.create("owner", input);
    mock.method(youtubePublishService, "upload", async () => {
      throw new Error(`${reason}: sensitive token`);
    });
    await processPublishJob(job.id);
    assert.equal(f.row("PublishJob").publishStatus, "FAILED");
    assert.ok(
      !String(f.row("PublishJob").errorMessage).includes("sensitive token"),
    );
  });
test("reconciliation waits for schedule and only confirms public videos", async () => {
  const f = fixture();
  const job = await publishService.create("owner", input);
  Object.assign(f.row("PublishJob"), {
    publishStatus: "SCHEDULED",
    externalVideoId: "youtube-id",
  });
  const lookup = mock.method(youtubePublishService, "status", async () => ({
    public: false,
    failed: false,
    missing: false,
    publishedAt: null,
  }));
  await reconcilePublishJob(job.id);
  assert.equal(lookup.mock.callCount(), 0);
  f.row("PublishJob").scheduledAt = now.subtract({ hours: 1 });
  await reconcilePublishJob(job.id);
  assert.equal(f.row("PublishJob").publishStatus, "SCHEDULED");
  lookup.mock.mockImplementation(async () => ({
    public: true,
    failed: false,
    missing: false,
    publishedAt: now.toString(),
  }));
  await reconcilePublishJob(job.id);
  assert.equal(f.row("PublishJob").publishStatus, "PUBLISHED");
});

function mockCredentials() {
  mock.method(auth.OAuth2.prototype, "refreshAccessToken", async () => ({
    credentials: { access_token: "test-access" },
  }));
  mock.method(auth.OAuth2.prototype, "getAccessToken", async () => ({
    token: "test-access",
  }));
}
test("actual upload streams B2 to a persisted resumable session with private publishAt metadata", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  const job = await claimPublishJob(created.id);
  assert.ok(job);
  mockCredentials();
  const stream = Readable.from([Buffer.from("video-bytes")]);
  mock.method(b2PublishingStorage, "getObjectStream", async () => ({
    stream,
    size: 11,
  }));
  const url =
    "https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test";
  mock.method(auth.OAuth2.prototype, "request", async (options: unknown) => {
    const status = metadataObject(metadataObject(options).data).status;
    assert.equal(metadataObject(status).privacyStatus, "private");
    assert.equal(metadataObject(status).publishAt, job.scheduledAt.toString());
    assert.equal(metadataObject(status).containsSyntheticMedia, true);
    return { headers: new Headers({ location: url }), data: {} };
  });
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  agent
    .get("https://www.googleapis.com")
    .intercept({
      path: "/upload/youtube/v3/videos?upload_id=test",
      method: "PUT",
    })
    .reply(() => {
      assert.ok(
        f.row("PublishJob").uploadSession,
        "persist session before uploading bytes",
      );
      return {
        statusCode: 200,
        data: JSON.stringify({ id: "uploaded-video" }),
      };
    });
  try {
    assert.equal(
      await youtubePublishService.upload(job, "video.mp4"),
      "uploaded-video",
    );
    agent.assertNoPendingInterceptors();
  } finally {
    setGlobalDispatcher(previous);
    await agent.close();
  }
  assert.equal(stream.destroyed, true);
});
test("lost final response recovers existing video ID without initiating another upload", async () => {
  fixture();
  const created = await publishService.create("owner", input);
  const job = await claimPublishJob(created.id);
  assert.ok(job);
  job.uploadSession = encryptToken(
    "https://www.googleapis.com/upload/youtube/v3/videos?upload_id=recover",
  );
  job.uploadSize = 11;
  mockCredentials();
  const storage = mock.method(
    b2PublishingStorage,
    "getObjectStream",
    async () => {
      throw new Error("Must not read storage for completed session");
    },
  );
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  agent
    .get("https://www.googleapis.com")
    .intercept({
      path: "/upload/youtube/v3/videos?upload_id=recover",
      method: "PUT",
    })
    .reply(200, { id: "existing-video" });
  try {
    assert.equal(
      await youtubePublishService.upload(job, "video.mp4"),
      "existing-video",
    );
    assert.equal(storage.mock.callCount(), 0);
  } finally {
    setGlobalDispatcher(previous);
    await agent.close();
  }
});
test("expired ambiguous session disables retries instead of duplicating the video", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  const job = await claimPublishJob(created.id);
  assert.ok(job);
  job.uploadSession = encryptToken(
    "https://www.googleapis.com/upload/youtube/v3/videos?upload_id=expired",
  );
  mockCredentials();
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  agent
    .get("https://www.googleapis.com")
    .intercept({
      path: "/upload/youtube/v3/videos?upload_id=expired",
      method: "PUT",
    })
    .reply(404, {});
  try {
    await assert.rejects(
      youtubePublishService.upload(job, "video.mp4"),
      /session expired/,
    );
    assert.equal(f.row("PublishJob").retryAllowed, false);
  } finally {
    setGlobalDispatcher(previous);
    await agent.close();
  }
});
test("token refresh failures are caught by the worker through the real upload service", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  mock.method(auth.OAuth2.prototype, "refreshAccessToken", async () => {
    throw new Error("invalid_grant secret");
  });
  await processPublishJob(created.id);
  assert.equal(f.row("PublishJob").publishStatus, "FAILED");
  assert.match(String(f.row("PublishJob").errorMessage), /Reconnect/);
});

test("missing B2 object fails safely before a YouTube session is created", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  mockCredentials();
  mock.method(b2PublishingStorage, "getObjectStream", async () => {
    throw Object.assign(new Error("private bucket path"), {
      name: "NoSuchKey",
    });
  });
  await processPublishJob(created.id);
  assert.equal(f.row("PublishJob").publishStatus, "FAILED");
  assert.equal(
    f.row("PublishJob").errorMessage,
    "The video file is missing from storage.",
  );
  assert.equal(f.row("PublishJob").uploadSession, null);
});
test("retry revalidates approval and snapshots a changed content schedule before upload", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  f.row("PublishJob").publishStatus = "FAILED";
  f.row("ContentIdea").scheduledDate = now.add({ hours: 4 });
  mockCredentials();
  mock.method(publishService, "get", async () => ({
    ...created,
    publishStatus: "FAILED",
  }));
  f.row("Approval").decision = "REJECTED";
  await assert.rejects(publishService.retry("owner", created.id), status(409));
  f.row("Approval").decision = "APPROVED";
  await publishService.retry("owner", created.id);
  assert.equal(f.row("PublishJob").publishStatus, "QUEUED");
  assert.equal(
    String(f.row("PublishJob").scheduledAt),
    String(f.row("ContentIdea").scheduledDate),
  );
  await assert.rejects(publishService.retry("owner", created.id), status(409));
});
test("retry refuses expired resumable schedules and ownership changes", async () => {
  const f = fixture();
  const created = await publishService.create("owner", input);
  Object.assign(f.row("PublishJob"), {
    publishStatus: "FAILED",
    scheduledAt: now.subtract({ hours: 1 }),
    uploadSession: "persisted",
  });
  mockCredentials();
  mock.method(publishService, "get", async () => ({
    ...created,
    publishStatus: "FAILED",
  }));
  await assert.rejects(publishService.retry("owner", created.id), status(409));
  f.row("PublishJob").scheduledAt = now.add({ hours: 1 });
  f.row("Project").ownerId = "other";
  await assert.rejects(publishService.retry("owner", created.id), status(404));
});
