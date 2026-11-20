# Grok–Hermes bridge (Railway Function)

`index.ts` is the source snapshot deployed to the Railway Function service `grok-hermes-bridge` in project `Lead & hermes`. The live service uses Railway's Bun Function image; this repo is the handoff source, not an auto-deploy link. Never place Railway variables, API keys, claim tokens, or OAuth tokens in this directory.

## Upload run isolation

Each `submit_upload_task` uses `X-Hermes-Session-Key: dkh:grok:upload:<task_id>`. The `task_id` is also the idempotency key. A retry with the same ID resumes/deduplicates the same task; a new upload uses a new ID and therefore a fresh Hermes conversation. Do not replace this with a shared session key or append group-chat history to the request.

For ERP-tracked work, supply `content_plan_id` and `platform` together. The bridge claims the ERP queue item and passes only that trusted plan to Hermes. The terminal result is written back to ERP when `check_upload_task` is called. The bridge still invokes an AI run for each accepted upload; it is not yet a deterministic Postiz worker.

## Safe update procedure

1. Compare this source with the current Railway Function code before editing; production may have changed.
2. Transpile-check the TypeScript, then update the Railway Function source and redeploy.
3. Verify deployment success and `GET /health` returns `{"bridge":"ok","erpWriteback":true}`.
4. Exercise a non-publishing test run before claiming token savings. Check Classai Router usage by API key and confirm input tokens per upload have fallen. Never use a live brand post as a test without the owner's instruction.

Keep the session key distinct per `task_id`; keep ERP claim and publication receipt logic intact. If the balance budget must be enforced, add a durable budget gate before starting Hermes runs and fail closed when the budget cannot be read.
