---
name: hike
description: Display a rich explanation of the current conversation. Only use when explicitly called.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash(mkdir*)
  - Bash(git status*)
  - Bash(git diff*)
  - Bash(git log*)
  - Bash(git rev-parse*)
  - Bash(git show*)
  - Bash(npx @code-hike/hike*)
version: 0.1.0
---

Write a narrative explaining what happened in this coding session.

## Phase 1: Gather context

Build a clear picture of what changed and why. Use whatever sources are available — pick the ones that fill in the gaps:

- **Conversation history** — the richest source when present. Extract the intent, pivots, decisions, and aha moments. Skip noise (retries, dead ends, routine tool output).
- **Git** — `git diff`, `git status`, `git log`. Essential when the conversation is thin or absent.
- **File reads** — read key changed files when the diff alone doesn't make the change legible.

By the end of this phase you should know:

- **Session goal** — what was the intent?
- **Files changed** — which files were touched?
- **Behavior changes** — what's different now?
- **Notable decisions** — what tradeoffs were made?

Discard dead ends. Only the final state matters.

## Phase 2: Decide Explanation Order

Look at all the files changed and think about the best order to present them. This is a teaching order, not the chronological order of the session.

- **Foundation before usage** — if file A defines a helper that file B uses, explain A first.
- **Setup before dependent logic** — config, types, schemas before the code that relies on them.
- **Core mechanism before edge cases** — the happy path first, error handling after.

The goal is that at every point in the narrative, the reader already has the context they need for what comes next. If a file change depends on understanding another file's change, the dependency comes first.

## Phase 3: Build the Steps for Each File

The goal is to split each file's diff into multiple small steps that make the changes easy to follow. The UI animates transitions between steps, so the reader only needs to notice what changed — not re-read the whole block.

Go through the ordered files one at a time. For each file, think about how to break the diff into steps.

### How to split

- One small concept per step. As a rule of thumb, _small_ is around 3 lines of new code — though it depends on complexity and atomicity. The idea is that each step should be easy to digest.
- If you're wondering whether to split — split.
- If it's a new file, start very small.

### What to include in each step

- Only the code that matters. Filler code or unimportant classnames distract the reader from the important parts.
- But always include parent scope / context so the reader knows where things are happening.
- If some code isn't used until a later step, wait until that step to introduce it. Don't preload imports, helpers, or variables.
- If needed, use comments to signal collapsed code or code that will be introduced later.
- If the step isn't self-evident, add a `!callout` to explain what's happening. Callouts also guide the reader's attention to the right place and help them parse the step faster.
- Max one `!callout` per step. If a step needs more than one, it's probably better to split into more steps.
- To highlight extra lines that are related to a callout, put `!mark` before each line to highlight.
- For extra information, use `!tooltip` — supplementary info shown on demand.

### Walk syntax

Each file gets one `<Walk>` block with a `filename` attribute. Inside it, each step is a code fence with `!!` in the metastring. Tooltip content goes in `## !id` headings after the steps.

````mdx
<Walk filename="app/api/mtime/route.ts">

```ts !!
// !tooltip[/force-dynamic/] dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  const filePath = getFilePath(fileName);
  // !callout[/statSync/] Read modified time from file system
  const stat = fs.statSync(filePath);
  return NextResponse.json({ mtime: stat.mtimeMs });
}
```

```ts !!
// !tooltip[/force-dynamic/] dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");

  // !mark
  if (!fileName) {
    // !callout[/NextResponse/] Handle missing file
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
    // !mark
  }

  const filePath = getFilePath(fileName);
  const stat = fs.statSync(filePath);
  return NextResponse.json({ mtime: stat.mtimeMs });
}
```

## !dynamic

Next.js caches route handlers by default; `force-dynamic` ensures every poll gets a fresh stat.

</Walk>
````

Annotation reference:

- `!callout[/regex/] message` — explains intent at a regex match.
- `!tooltip[/regex/] id` — on-demand detail.
- `!mark` — placed before a line to highlight it (no message, just visual emphasis).
- Match comment style to language, for example:
  - TS/JS: `// !callout[...]`
  - JSX/TSX blocks: `{/* !callout[...] */}`

## Phase 4: Structure the Narrative Around the `<Walk>`

Now assemble the full MDX file. The `<Walk>` blocks are the backbone — the prose exists to connect and contextualize them.

**Start with the problem statement:** One sentence. What's broken or missing, where it shows up, why the change is needed. This comes before any code.

**Then alternate between `<Walk>` and prose transitions:**

- Between `<Walk>` blocks (different files), add a short prose transition if the connection isn't obvious. State the intent ("now wire the limiter into the route") not the implementation details the reader is about to see.
- If a non-trivial flow connects two files, consider a Mermaid diagram (` ```mermaid `) — but only if multiple actors or branches make prose hard to follow. For linear flows, prose is better.

**Prose style:** Short sentences. Front-load the key point. Bold sparingly for scanning. Inline code as _`symbol`_. End with a colon when directly introducing a code block. Don't repeat what's visible in the snippet.

**Comment syntax for annotations:** TS/JS → `// !callout[...]`, JSX → `{/* !callout[...] */}`. Annotations (`!mark`, `!callout`, `!diff`, `!tooltip`) only work inside `<Walk>`-managed code blocks. Outside them, use standard fenced code blocks with short prose.

**Close with completeness:** The final steps should show the complete working mechanism.

### Finishing touches

**Add frontmatter** at the top of the file:

```yaml
---
title: "Human-readable session title"
date: "YYYY-MM-DDTHH:MM:SS"
version: "the version of this skill"
---
```

**Check for missing context.** Re-read the map and the narrative side by side. If there's any important information from the map that didn't make it into the narrative — a key decision, a tradeoff, a non-obvious reason for a change — find the right place and way to include it.

## Phase 5: Append Raw Thought Process

**Important: do this as you work, not after.** During Phases 1–4, whenever you're thinking through a decision — ordering files, splitting steps, deciding what to cut — write those thoughts down immediately in a scratch area. Don't wait until the end to reconstruct your reasoning; that produces rationalization, not the real process.

After the hike file is complete, append all of those raw notes to the end of the file inside an MDX comment:

```
---

## Thought Process

(raw notes here)

```

This should be unedited stream-of-consciousness — the messy real-time reasoning, not a clean retrospective. Include false starts, uncertainties, things you almost did differently. The goal is to preserve the actual decision trail so the author can later understand what really happened during generation.

## Phase 6: Store and Display

**Before writing, check for secrets.** Scan the full output for API keys, tokens, passwords, credentials, or private URLs. Redact or omit any that appear.

Write to `.hike/<descriptive-slug>.mdx`. Derive the slug from session content (e.g., `add-dark-mode-toggle.mdx`, `fix-auth-redirect-loop.mdx`, `refactor-api-client.mdx`). Create `.hike/` if it doesn't exist.

Run `npx @code-hike/hike@^<version> <filename>` in the background to open a browser preview. Use the version of this skill prefixed with `^` for compatible versions. Use `run_in_background: true` so the user can review at their own pace without blocking the conversation:

```bash
npx @code-hike/hike@^<version> <slug>.mdx
```
