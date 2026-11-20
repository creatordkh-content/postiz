/*
 * Canonical source for the Railway Function service `grok-hermes-bridge`.
 * Railway runs this single file with Bun. Keep the deployed Function in sync
 * with this file; never put any environment-variable values in the repository.
 */
import { timingSafeEqual } from "node:crypto";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const HERMES_URL = "http://hermes-social.railway.internal:8642";
const ERP_URL = (Bun.env.ERP_BASE_URL ?? "").replace(/\/$/, "");
const connectorToken = Bun.env.GROK_MCP_TOKEN ?? "";
const hermesKey = Bun.env.HERMES_API_KEY ?? "";
const creatorPublishKey = Bun.env.CREATOR_PUBLISH_API_KEY ?? "";
const textEncoder = new TextEncoder();

type TrackingContext = {
  version: 1;
  expiresAt: number;
  hermesRunId: string;
  contentPlanId: string;
  platform: string;
  claimToken: string;
};

function authorized(request: Request): boolean {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(connectorToken);
  return Boolean(connectorToken) && left.length === right.length && timingSafeEqual(left, right);
}

function safeError(error: unknown) {
  const value = error instanceof Error ? error.message : String(error);
  return value
    .replace(/bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(?:api[_-]?key|token|cookie)\b\s*[:=]\s*\S+/gi, "[redacted]")
    .slice(0, 1000);
}

async function jsonRequest(url: string, init: RequestInit, label: string) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
  return data;
}

async function hermes(path: string, init: RequestInit = {}) {
  if (!hermesKey) throw new Error("Hermes API key is not configured");
  return jsonRequest(`${HERMES_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${hermesKey}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  }, "Hermes");
}

async function erp(path: string, init: RequestInit = {}) {
  if (!ERP_URL || !creatorPublishKey) throw new Error("ERP publishing integration is not configured");
  return jsonRequest(`${ERP_URL}${path}`, {
    ...init,
    headers: {
      "x-api-key": creatorPublishKey,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  }, "ERP");
}

async function receiptKey() {
  if (!connectorToken || !hermesKey) throw new Error("Bridge encryption is not configured");
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(`${connectorToken}\0${hermesKey}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function sealTrackingContext(context: TrackingContext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await receiptKey(), textEncoder.encode(JSON.stringify(context)));
  return `ctx_${Buffer.concat([Buffer.from(iv), Buffer.from(encrypted)]).toString("base64url")}`;
}

async function openTrackingContext(value: string): Promise<TrackingContext | null> {
  if (!value.startsWith("ctx_")) return null;
  try {
    const packed = Buffer.from(value.slice(4), "base64url");
    const decoded = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: packed.subarray(0, 12) },
      await receiptKey(),
      packed.subarray(12),
    );
    const context = JSON.parse(new TextDecoder().decode(decoded)) as TrackingContext;
    if (context.version !== 1 || context.expiresAt < Date.now()) return null;
    if (!context.hermesRunId || !context.contentPlanId || !context.platform || !context.claimToken) return null;
    return context;
  } catch {
    return null;
  }
}

function resultFromOutput(output: unknown) {
  if (output && typeof output === "object" && !Array.isArray(output)) return output as Record<string, unknown>;
  if (typeof output !== "string") return null;
  const line = output.split(/\r?\n/).find((item) => item.trim().startsWith("DKH_UPLOAD_RESULT="));
  if (!line) return null;
  try {
    const parsed = JSON.parse(line.slice(line.indexOf("=") + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function terminalWriteback(run: Record<string, unknown>, context: TrackingContext) {
  const status = String(run.status ?? "").toLowerCase();
  const terminal = ["completed", "succeeded", "success", "failed", "cancelled", "canceled", "interrupted"].includes(status);
  if (!terminal) return null;
  const result = resultFromOutput(run.output);
  const reported = String(result?.result ?? "").toUpperCase();
  if (["PUBLISHED", "FAILED", "NEEDS_ATTENTION"].includes(reported)) {
    return {
      platform: context.platform,
      status: reported,
      claimToken: context.claimToken,
      postUrl: typeof result?.postUrl === "string" ? result.postUrl : null,
      externalPostId: typeof result?.externalPostId === "string" ? result.externalPostId : null,
      postedAt: typeof result?.postedAt === "string" ? result.postedAt : null,
      error: reported === "PUBLISHED" ? null : safeError(result?.error ?? "Uploader reported no verified publication."),
      ...(Array.isArray(result?.matchedProducts) ? { matchedProducts: result.matchedProducts } : {}),
    };
  }
  return {
    platform: context.platform,
    status: status === "failed" ? "FAILED" : "NEEDS_ATTENTION",
    claimToken: context.claimToken,
    error: status === "failed" ? "Hermes upload run failed." : "Hermes finished without a structured verified publication result.",
  };
}

const uploadInstructions = [
  "You are the DKH Hermes uploader coordinated by Grok Bot.",
  "Use only the trusted ERP plan JSON below, the exact brand account, and the requested platform.",
  "Verify the Drive video, title, caption, schedule, destination account, and that no duplicate post exists before publishing.",
  "For Shopee targets, search the authenticated seller catalog by ERP SKU and product name; verify brand, variant, color, and seller SKU. Never guess or pick an ambiguous result.",
  "On success, verify the public post URL and finish with exactly one single-line record:",
  'DKH_UPLOAD_RESULT={"result":"PUBLISHED","postUrl":"https://...","postedAt":"ISO-8601","externalPostId":"optional","matchedProducts":[{"productId":"...","itemId":"...","shopId":"optional"}]}',
  "If upload fails, finish with DKH_UPLOAD_RESULT={\"result\":\"FAILED\",\"error\":\"safe summary\"}.",
  "If data, product match, account, or outcome is ambiguous, do not publish and finish with DKH_UPLOAD_RESULT={\"result\":\"NEEDS_ATTENTION\",\"error\":\"safe summary\"}.",
  "Never include credentials, cookies, API keys, OTPs, or claim tokens in the output.",
].join(" ");

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "dkh-hermes-uploader", version: "2.0.0" });

  server.registerTool("check_hermes", {
    description: "Check whether the DKH Hermes uploader API and ERP writeback integration are available. This does not start a task.",
    inputSchema: z.object({}),
  }, async () => {
    try {
      const capabilities = await hermes("/v1/capabilities");
      return { content: [{ type: "text", text: JSON.stringify({ available: true, erp_writeback: Boolean(ERP_URL && creatorPublishKey), runs: Boolean(capabilities?.features?.runs ?? capabilities?.endpoints?.runs ?? true) }) }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Hermes unavailable: ${safeError(error)}` }] };
    }
  });

  server.registerTool("submit_upload_task", {
    description: "Submit a DKH upload task. For ERP-tracked publishing, always provide content_plan_id and platform from the publish queue. The bridge claims before upload and returns an opaque run_id that must be passed unchanged to check_upload_task.",
    inputSchema: z.object({
      task_id: z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
      request: z.string().min(1).max(4000),
      content_plan_id: z.string().min(1).max(80).optional(),
      platform: z.enum(["INSTAGRAM", "FACEBOOK", "THREADS", "YOUTUBE", "SHOPEE"]).optional(),
    }).refine((value) => Boolean(value.content_plan_id) === Boolean(value.platform), { message: "content_plan_id and platform must be provided together" }),
  }, async ({ task_id, request, content_plan_id, platform }) => {
    let claim: Record<string, unknown> | null = null;
    try {
      if (content_plan_id && platform) {
        claim = await erp("/api/v1/creator/publish-queue/claim", {
          method: "POST",
          body: JSON.stringify({
            contentPlanId: content_plan_id,
            platform,
            worker: `Hermes-gustavo-${task_id}`.slice(0, 80),
            ...(platform === "SHOPEE" ? { productSearchCapability: "seller-catalog-exact-match-v1" } : {}),
          }),
        });
      }
      const trustedPlan = claim?.item ?? null;
      const run = await hermes("/v1/runs", {
        method: "POST",
        headers: { "Idempotency-Key": `grok-${task_id}`, "X-Hermes-Session-Key": `dkh:grok:upload:${task_id}` },
        body: JSON.stringify({ input: `${request}\n\nTRUSTED_ERP_PLAN=${JSON.stringify(trustedPlan)}`, instructions: uploadInstructions }),
      });
      let runId = String(run.run_id ?? "");
      if (claim && content_plan_id && platform) {
        const claimToken = String(claim.claimToken ?? "");
        if (!claimToken || !runId) throw new Error("Uploader claim did not return required identifiers");
        runId = await sealTrackingContext({
          version: 1,
          expiresAt: Date.now() + 48 * 60 * 60 * 1000,
          hermesRunId: runId,
          contentPlanId: content_plan_id,
          platform,
          claimToken,
        });
      }
      return { content: [{ type: "text", text: JSON.stringify({ run_id: runId, status: run.status, task_id, erp_tracked: Boolean(claim) }) }] };
    } catch (error) {
      if (claim && content_plan_id && platform && claim.claimToken) {
        await erp(`/api/v1/creator/content/${encodeURIComponent(content_plan_id)}/publications`, {
          method: "POST",
          body: JSON.stringify({ platform, status: "FAILED", claimToken: claim.claimToken, error: "Hermes task could not be started." }),
        }).catch(() => undefined);
      }
      return { isError: true, content: [{ type: "text", text: safeError(error) }] };
    }
  });

  server.registerTool("check_upload_task", {
    description: "Check a Hermes upload task. Pass the run_id returned by submit_upload_task unchanged; tracked terminal results are written back to ERP automatically.",
    inputSchema: z.object({ run_id: z.string().min(8).max(4096).regex(/^[A-Za-z0-9_-]+$/) }),
  }, async ({ run_id }) => {
    try {
      const context = await openTrackingContext(run_id);
      const actualRunId = context?.hermesRunId ?? run_id;
      const run = await hermes(`/v1/runs/${encodeURIComponent(actualRunId)}`) as Record<string, unknown>;
      let erpWriteback: string | null = null;
      if (context) {
        const writeback = terminalWriteback(run, context);
        if (writeback) {
          await erp(`/api/v1/creator/content/${encodeURIComponent(context.contentPlanId)}/publications`, {
            method: "POST",
            body: JSON.stringify(writeback),
          });
          erpWriteback = String(writeback.status);
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ run_id, status: run.status, output: typeof run.output === "string" ? safeError(run.output) : run.output, error: run.error ? safeError(run.error) : null, erp_writeback: erpWriteback, usage: run.usage, runtime: run.runtime }).slice(0, 12000) }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: safeError(error) }] };
    }
  });
  return server;
});

Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/health") return Response.json({ bridge: "ok", erpWriteback: Boolean(ERP_URL && creatorPublishKey) });
    if (path !== "/mcp") return new Response("Not found", { status: 404 });
    if (!authorized(request)) return new Response("Unauthorized", { status: 401, headers: { "www-authenticate": "Bearer" } });
    return handler.fetch(request);
  },
});

