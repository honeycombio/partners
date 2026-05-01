---
# Cursor Agent Skill metadata — safe for other agents to ignore as frontmatter.
name: online-boutique-mcp-investigate
description: >-
  Runs collaborative frontend/backend observability investigations using MCP
  servers honeycomb-workshop (backend traces) and embrace-workshop (Embrace mobile
  / session data), starting either from Honeycomb or from Embrace. Use when the
  user invokes /investigate, asks to narrow a production or demo issue across web +
  backend, correlate Honeycomb traces with Embrace, or debug full-stack
  observability with this workshop demo stack.
disable-model-invocation: true
---

# Observability investigation (Honeycomb + Embrace MCP)

Portable playbook for **Cursor**, **Claude Code**, **GitHub Copilot** (chat or Agent), and comparable coding agents. The workflow below is identical across tools; only *how you attach this document* differs.

## How to use this file (by agent)

- **Cursor** — Loads as an Agent Skill from this path when configured under project or personal skills. Optional chat shortcut: **`/investigate`** if you mapped a rule or slash command to this workflow (not defined by Markdown alone).
- **Claude Code** — Register MCP servers first (see [`claude-example.md`](claude-example.md) in this folder). Point the agent at **this file** (`embrace/online-boutique/mcp/skill.md`) via `@` / file reference, `#` project memory / `CLAUDE.md` include, or by pasting “follow `skill.md` in `mcp/` for investigations.” Prefer MCP server aliases **`honeycomb-workshop`** and **`embrace-workshop`** to match the steps below.
- **GitHub Copilot** — Declare this path in [repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide) (for example `.github/copilot-instructions.md` / `.github/instructions/*.instructions.md`), or **`@`**-mention **`embrace/online-boutique/mcp/skill.md`** (or **`@workspace`**) when starting an investigation. Copilot ignores the YAML header; the Markdown body is the contract.

Whenever you investigate, execute the **`/investigate` workflow**: collaborative use of **`honeycomb-workshop`** and **`embrace-workshop`** MCP servers as documented below.

### When this workflow applies

User asks to **`/investigate`**, correlate **Honeycomb ↔ Embrace**, narrow **frontend vs backend** cause for the online-boutique / workshop demo stack, or run a **multi-tool observability drill** using these MCPs—whether they already have **traces**, **sessions**, **device id**, **session id**, or only one side’s context.

## Goal

Locate and narrow potential issues for an application with **frontend and backend**. Prioritize narrowing **where the problem originates**:

1. **Frontend-originating** → drill with **embrace-workshop** (sessions, devices, timelines, Embrace-linked signals).
2. **Backend-originating** → drill with **honeycomb-workshop** (traces, spans, service behavior).

Treat the outcome as iterative: hypotheses, evidence from each MCP, then refine until a plausible root cause is supported by both sides when correlation is needed.

## Important Honeycomb dataset

- **Primary dataset (required):** `ms_demo_honoeycomb_+_embrace-web-development`
- **Do not use** the `browser` dataset for this integrated frontend story: it is a **standalone** web frontend, **not** the frontend integrated with Embrace for this demo.

Configure MCP access per project `embrace/online-boutique/mcp/mcp.json` (Bearer tokens belong in config, never in chats or commits).

## Correlating backend traces to Embrace (frontend side)

Inspect the **root span** (or upstream Embrace-connected span) of traces in the primary dataset. These attributes link Honeycomb ↔ Embrace:

| Attribute | Role |
|-----------|------|
| `emb.app_id` | Unique Embrace identifier for the application. |
| `emb.app_version` | Version number; should align with Embrace-side app version when investigating mismatches or regressions. |
| `emb.device_id` | Device identifier in Embrace for the affected client. |
| `emb.dashboard_session` | **Session timeline:** URL tying this trace to device + session; open or query via embrace-workshop workflows as appropriate for session-level analysis. |
| `traceparent` | W3C trace context propagated from Embrace when forwarding spans to Honeycomb; use for propagation and cross-tool alignment. |

## Investigation sequences (recommended)

Pick **one** starting point; iterate with the other tool as needed.

### Sequence A — start from Honeycomb (backend-first)

Use when traces or APIs are already the lead signal.

1. **Honeycomb (`honeycomb-workshop`)** on `ms_demo_honoeycomb_+_embrace-web-development`: confirm time range, service/operation signals, errors, latency. Pull **trace IDs** and read **root span** Embrace-related attributes above.
2. **Classify suspicion:** Backend-only anomalies (pure server errors, invariant DB issues) vs patterns that imply client/session/version/device issues → favor **embrace-workshop**.
3. **Embrace (`embrace-workshop`):** Using `emb.app_id`, **`emb.device_id`**, **`emb.dashboard_session`**, **`emb.app_version`**, and `traceparent` / timing, inspect sessions, breadcrumbs, errors, or performance aligned with what Honeycomb showed.
4. **Resolve:** Document whether evidence points to frontend (Embrace-leading) or backend (Honeycomb-leading), with cross-links via the attributes. If inconclusive, alternate passes with tighter filters (trace, device, version, time window).

### Sequence B — start from Embrace (frontend-first)

Use when **errors**, **crashes**, or other **abnormal client/session behavior** surfaced in Embrace first; then confirm or rule out backend contribution in Honeycomb.

1. **`embrace-workshop`:** Investigate anomalies (errors, crashes, outliers, stalled flows). Identify the impacted **device**, **session**, **`emb.app_version`**, and **`emb.app_id`** as applicable. Capture **session id** and **`emb.device_id`** from Embrace (session id appears in tooling or URLs such as **`emb.dashboard_session`** on the correlated Honeycomb side—reuse the same identifiers Embrace exposes for “this session / this device”).
2. **`honeycomb-workshop`:** In **`ms_demo_honoeycomb_+_embrace-web-development`**, search for traces/spans keyed by the same linkage—at minimum **`emb.device_id`** and the **session** dimension (Honeycomb column may be **`emb.dashboard_session`** and/or another session field depending on ingestion; use dataset schema tools to resolve the exact attribute name **before** authoring queries).
3. **Analyze matching traces:** For hits, review span hierarchy, latency, errors, and downstream dependency behavior to see whether the issue correlates with **backend** failures versus **purely client-side** explanations.
4. **Resolve:** State whether findings implicate frontend-only, backend, or interaction (e.g. bad payload/version paired with failing service path). Iterate with tightened time windows or `traceparent` if matches are ambiguous.

## MCP server names

- **`honeycomb-workshop`** — Honeycomb queries, traces, datasets (use primary dataset only for this flow).
- **`embrace-workshop`** — Embrace session and device context for the integrated client.

Before calling tools, read each server’s tool schemas (required parameters, auth) from the client’s MCP configuration.
