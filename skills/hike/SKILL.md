---
name: hike
description: Display a rich explanation of the current conversation. Only use when explicitly called.
version: 0.1.6
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
- **Split a file across multiple `<Walk>` blocks when it helps** — if a file has many changes or changes that serve different purposes, explain each group in a separate `<Walk>` placed where it fits in the narrative. Don't force everything into one block just because it's the same file.

The goal is that at every point in the narrative, the reader already has the context they need for what comes next. If a file change depends on understanding another file's change, the dependency comes first.

## Phase 3: Build the Steps for Each File

The goal is to split each file's diff into multiple small steps that make the changes easy to follow. The UI animates transitions between steps, so the reader only needs to notice what changed — not re-read the whole block.

Go through the ordered files one at a time. For each file, think about how to break the diff into steps.

### How to split

- **Hard limit: no more than 5 new or changed lines per step.** (Collapsing previously-introduced code into a comment doesn't count as a changed line.) If a step exceeds this, split it — no exceptions.
- If you're wondering whether to split — split.
- If it's a new file, start very small.
- Keep some shared code between consecutive steps so the reader has an anchor for the transition. If two steps share no code at all, they probably belong in separate `<Walk>` blocks.
- **Freeze context code between steps.** Code carried over from a previous step for orientation must not change — don't silently add, modify, or reorder lines in it. (Collapsing multiple lines into a comment is fine — that reduces noise.) If the reader sees the context shift, their attention splits between the context change and the new code you're actually introducing. If you need to change that code too, do it in its own step first.

### What to include in each step

- Only the code that matters. Filler code or unimportant classnames distract the reader from the important parts.
- **Always include parent scope.** Every snippet must show all enclosing scopes up to the top-level declaration (function, class, component) so the reader knows _where_ in the file the code lives. Never show floating lines without their surrounding structure.
- If some code isn't used until a later step, wait until that step to introduce it. Don't preload imports, helpers, or variables.
- If needed, use comments to signal collapsed code, code that will be introduced later, or code from earlier steps that is no longer relevant to the current step.
- **Add a `!callout` to every step.** Callouts guide the reader's attention and help them parse the step faster. Carefully pick the most important line in the step to place the callout — it should point to the key change.
- Max one `!callout` per step. If a step needs more than one callout, it's probably better to split into more steps.
- **Mark changes.** By default, every line that comes from the diff and is first introduced in the current step gets a `!mark` — except the line targeted by the `!callout`. Deviate from these defaults only with good reason (e.g., skip marks when most lines in the step would be marked — in that case the marks add no signal).
- For extra information, use `!tooltip` — supplementary info shown on demand.

### Walk syntax

Each group of related changes gets one `<Walk>` block with a `filename` attribute (a file may have multiple `<Walk>` blocks if its changes are unrelated — see Phase 2). Inside it, each step is a code fence with "!!" in the metastring. Tooltip content goes in `## !id` headings after the steps.

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

- `!callout[/regex/] message` — explains intent at a regex match on the next line.
- `!tooltip[/regex/] id` — on-demand detail, matching regex on the next line.
- `!mark` — highlights the next line (no message, just visual emphasis).
- `!diff -` — marks the next line as removed (struck-through / red). Use when highlighting a deletion is important for the explanation.
- Match comment style to language, for example:
  - TS/JS: `// !callout[...]`
  - JSX/TSX blocks: `{/* !callout[...] */}`

### Common Pitfalls

#### Parent scope

Every snippet must show all enclosing scopes up to the top-level declaration. Never show floating lines.

Bad — shows the inner function but not where it lives:

```tsx
function handleDelete() {
  // ...
}
```

Good — full nesting visible:

```tsx
function UserCard() {
  function handleDelete() {
    // ...
  }
  // ...
}
```

Bad — floating JSX, no enclosing component:

```tsx
<button onClick={handleDelete}>
  <Trash2 className="size-4" />
</button>
```

Good — component scope visible:

```tsx
function UserCard() {
  return (
    <div>
      <button onClick={handleDelete}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
```

#### Mark usage

`!mark` highlights the **next line only** — it is not a range boundary. Put one `!mark` before each changed line.

Bad — no marks, changed lines buried in context:

```ts
export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  const filePath = getFilePath(fileName);
  if (!fileName) {
    return NextResponse.json({ error: "Missing param" }, { status: 400 });
  }
  const normalized = path.normalize(filePath);
  // !callout[/startsWith/] Prevent path traversal
  if (!normalized.startsWith(BASE_DIR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stat = fs.statSync(filePath);
  return NextResponse.json({ mtime: stat.mtimeMs });
}
```

Bad — treats `!mark` as range delimiters, only first and last changed lines get highlighted:

```ts
export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  const filePath = getFilePath(fileName);
  // !mark
  if (!fileName) {
    return NextResponse.json({ error: "Missing param" }, { status: 400 });
  }
  const normalized = path.normalize(filePath);
  // !callout[/startsWith/] Prevent path traversal
  if (!normalized.startsWith(BASE_DIR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // !mark
  const stat = fs.statSync(filePath);
  return NextResponse.json({ mtime: stat.mtimeMs });
}
```

Good — one `!mark` before each changed line (callout line excluded):

```ts
export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  const filePath = getFilePath(fileName);
  // !mark
  if (!fileName) {
    // !mark
    return NextResponse.json({ error: "Missing param" }, { status: 400 });
    // !mark
  }
  // !mark
  const normalized = path.normalize(filePath);
  // !callout[/startsWith/] Prevent path traversal
  if (!normalized.startsWith(BASE_DIR)) {
    // !mark
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // !mark
  }
  const stat = fs.statSync(filePath);
  return NextResponse.json({ mtime: stat.mtimeMs });
}
```

#### Callout and mark on the same line

A `!callout` already draws attention to its target line — adding `!mark` on the same line is redundant.

Bad:

```ts
  // !callout[/startsWith/] Prevent path traversal
  // !mark
  if (!normalized.startsWith(BASE_DIR)) {
```

Good:

```ts
  // !callout[/startsWith/] Prevent path traversal
  if (!normalized.startsWith(BASE_DIR)) {
```

#### Callout placement

`!callout` targets the **next line**. Place it immediately before the line you want to annotate, not at the top of the block.

Bad — callout taregeting `/youtubeId/` that's not in the next line:

```tsx
// !callout[/youtubeId/] Include in the save payload
export function SongContent({ songId, initialSong }: SongContentProps) {
  // ...
  body: JSON.stringify({ sections, youtubeId: youtubeId || undefined }),
  // ...
}
```

Good — callout right before its target line:

```tsx
export function SongContent({ songId, initialSong }: SongContentProps) {
  // ...
  // !callout[/youtubeId/] Include in the save payload
  body: JSON.stringify({ sections, youtubeId: youtubeId || undefined }),
  // ...
}
```

#### Comment syntax

Annotation comments must use the comment syntax of the surrounding context.

Bad — `//` comments inside JSX:

```tsx
function UserCard() {
  // !mark
  const name = "Alice";
  return (
    <div>
      // !mark
      <button onClick={handleClick}>Save</button>
    </div>
  );
}
```

Good — `//` in JS context, `{/* */}` in JSX context:

```tsx
function UserCard() {
  // !mark
  const name = "Alice";
  return (
    <div>
      {/* !mark */}
      <button onClick={handleClick}>Save</button>
    </div>
  );
}
```

### Phase 3.1: Self-review

After building all steps for a file, re-read each step and verify:

1. Does it show the enclosing function/class/block? If not, add parent scope.
2. Is there filler code that doesn't serve the explanation? If so, trim it.
3. Does it introduce code that isn't relevant until a later step? If so, move it.
4. Does the step have more than 5 new or changed lines? If so, split it.
5. Do consecutive steps share enough code for the reader to stay oriented? If not, add shared context.
6. If the step isn't self-evident, does it have a `!callout`? If not, add one.
7. Scan the step line by line. For each code line (not annotation comments), ask: is this from the diff and first introduced in this step? If yes, it needs a `!mark` before it (unless it's the callout target). Only skip marks with good reason.
8. Compare each step's context code to the previous step. Is any carried-over code different (other than collapsing multiple lines into a comment)? If so, freeze it or move the change to its own step.
9. Are all annotation comments (`!callout`, `!mark`, `!tooltip`, `!diff`) using the correct comment syntax for their context? (`//` in JS/TS, `{/* */}` in JSX)

Fix any violations before moving to the next file.

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
date: "YYYY-MM-DDTHH:MM:SS" # must include the time, not just the date
version: "the version of this skill"
---
```

**Check for missing context.** Re-read the map and the narrative side by side. If there's any important information from the map that didn't make it into the narrative — a key decision, a tradeoff, a non-obvious reason for a change — find the right place and way to include it.

## Phase 5: Append Raw Thought Process

**Important: do this as you work, not after.** During Phases 1–4, whenever you're thinking through a decision — ordering files, splitting steps, deciding what to cut — write those thoughts down immediately in a scratch area. Don't wait until the end to reconstruct your reasoning; that produces rationalization, not the real process. **Log when you transition between phases** (e.g., "--- moving to Phase 3 ---") so the decision trail is easy to follow.

After the hike file is complete, append all of those raw notes to the end of the file inside an MDX comment:

```
---

## Thought Process

(raw notes here)

```

This should be unedited stream-of-consciousness — the messy real-time reasoning, not a clean retrospective. Include false starts, uncertainties, things you almost did differently. The goal is to preserve the actual decision trail so the author can later understand what really happened during generation.

## Phase 6: Store and Display

**Before writing, check for secrets.** Scan the full output for API keys, tokens, passwords, credentials, or private URLs. Redact or omit any that appear.

Write to `.hike/<descriptive-slug>.mdx`. Derive the slug from session content (e.g., `add-dark-mode-toggle.mdx`, `fix-auth-redirect-loop.mdx`, `refactor-api-client.mdx`). Create `.hike/` if it doesn't exist. If the file already exists, append `-2`, `-3`, etc. (e.g., `add-dark-mode-toggle-2.mdx`).

Run `npx @code-hike/hike@^<version> <filename>` in the background to open a browser preview. Use the version of this skill prefixed with `^` for compatible versions. Use `run_in_background: true` so the user can review at their own pace without blocking the conversation. **Run the command in the user's current working directory** (not inside `.hike/`):

```bash
npx @code-hike/hike@^<version> <slug>.mdx
```
