import { AnnotationHandler, Pre, RawCode, highlight } from "codehike/code";

import { cn } from "@/lib/utils";
import { getHandlers } from "./code.handlers";
import { theme, flagsToOptions, CodeInfo } from "./code.config";

import { CopyButton } from "./code.copy";
import { CodeIcon } from "./code.icon";

export async function DocsKitCode(props: {
  codeblock: RawCode;
  handlers?: AnnotationHandler[];
}) {
  const { codeblock, ...rest } = props;
  const group = await toCodeGroup({ codeblocks: [codeblock], ...rest });
  return <SingleCode group={group} />;
}

export async function SingleCode(props: { group: CodeInfo }) {
  const { pre, title, code, icon, options } = props.group.tabs[0];

  const showCopy = options?.copyButton;

  return (
    <div className="rounded overflow-hidden relative border-dk-border flex flex-col border my-4 not-prose">
      {title ? (
        <div
          className={cn(
            "border-b-[1px] border-dk-border bg-dk-tabs-background px-3 py-0",
            "w-full h-9 flex items-center justify-between shrink-0",
            "text-dk-tab-inactive-foreground text-sm font-mono",
          )}
        >
          <div className="flex items-center w-full h-5 gap-2">
            <div className="size-4">{icon}</div>
            <span className="leading-none">{title}</span>
            {showCopy && (
              <div className="ml-auto items-center flex">
                <CopyButton
                  text={code}
                  className="text-dk-tab-inactive-foreground"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        showCopy && (
          <CopyButton
            text={code}
            className="absolute right-3 my-0 top-3 text-dk-tab-inactive-foreground bg-dk-background/70"
          />
        )
      )}
      {pre}
    </div>
  );
}

export async function toCodeGroup(props: {
  codeblocks: RawCode[];
  flags?: string;
  storage?: string;
  filename?: string;
  forceDiffGutter?: boolean;
  handlers?: AnnotationHandler[];
}): Promise<CodeInfo> {
  const groupOptions = flagsToOptions(props.flags);

  const tabs = await Promise.all(
    props.codeblocks.map(async (tab) => {
      const { flags, title } = extractFlags(tab);
      const resolvedTitle = title || props.filename || "";
      const tabOptions = flagsToOptions(flags);
      const options = {
        ...groupOptions,
        ...tabOptions,
        ...(props.forceDiffGutter ? { forceDiffGutter: true } : {}),
      };

      const highlighted = await highlight(
        { ...tab, lang: tab.lang || "txt" },
        theme,
      );
      const handlers = getHandlers(options);
      if (props.handlers) {
        handlers.push(...props.handlers);
      }
      const highlightedStyle = { ...highlighted.style };
      delete highlightedStyle.background;
      return {
        options,
        title: resolvedTitle,
        code: highlighted.code,
        icon: (
          <CodeIcon title={resolvedTitle} lang={tab.lang} className="opacity-60" />
        ),
        lang: tab.lang,
        pre: (
          <Pre
            code={highlighted}
            className="overflow-auto px-0 py-3 m-0 rounded-none !bg-dk-background selection:bg-dk-selection selection:text-current max-h-full flex-1 text-sm"
            style={highlightedStyle}
            handlers={handlers}
          />
        ),
      };
    }),
  );

  return {
    storage: props.storage,
    options: {
      ...groupOptions,
      ...(props.forceDiffGutter ? { forceDiffGutter: true } : {}),
    },
    tabs,
  };
}

function extractFlags(codeblock: RawCode) {
  const flags =
    codeblock.meta.split(" ").filter((flag) => flag.startsWith("-"))[0] ?? "";
  const metaWithoutFlags = !flags
    ? codeblock.meta
    : codeblock.meta === flags
      ? ""
      : codeblock.meta.replace(" " + flags, "").trim();
  const title = metaWithoutFlags.trim();
  return { title, flags: flags.slice(1) };
}
