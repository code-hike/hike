import {
  AnnotationHandler,
  CodeAnnotation,
  InnerLine,
  InlineAnnotation,
} from "codehike/code"

type DiffHandlerOptions = {
  forceGutter?: boolean
}

export function createDiffHandler(
  options: DiffHandlerOptions = {},
): AnnotationHandler {
  const forceGutter = options.forceGutter ?? false

  return {
    name: "diff",
    onlyIfAnnotated: !forceGutter,
    transform: (annotation: CodeAnnotation) => {
      if (!("fromColumn" in annotation)) {
        return [annotation]
      }

      // For inline diffs, also add a line-level annotation so the +/- gutter
      // marker is rendered at the start of the line.
      const inlineAnnotation = annotation as InlineAnnotation
      const lineAnnotation = {
        name: inlineAnnotation.name,
        query: inlineAnnotation.query,
        fromLineNumber: inlineAnnotation.lineNumber,
        toLineNumber: inlineAnnotation.lineNumber,
        data: { inline: true },
      }
      return [lineAnnotation, inlineAnnotation]
    },
    Block: ({ annotation, children }) => {
      if (annotation.data?.inline) {
        return <>{children}</>
      }

      const color = getColor(annotation)
      return (
        <div
          style={{
            ["--dk-line-bg" as string]: `rgb(from ${color} r g b / 0.13)`,
            ["--dk-line-border" as string]: color,
          }}
        >
          {children}
        </div>
      )
    },
    Inline: ({ annotation, children }) => {
      const color = getColor(annotation)
      return (
        <span
          style={{
            boxShadow: `0 0 0 1px rgb(from ${color} r g b / 0.5)`,
            backgroundColor: `rgb(from ${color} r g b / 0.13)`,
          }}
          className="rounded px-0.5 py-0 -mx-0.5"
        >
          {children}
        </span>
      )
    },
    Line: ({ annotation, ...props }) => (
      <>
        <div
          className="min-w-[1ch] box-content opacity-70 pl-2 select-none"
          style={{ visibility: annotation ? "visible" : "hidden" }}
          aria-hidden="true"
        >
          {annotation?.query ?? "+"}
        </div>
        <InnerLine merge={props} />
      </>
    ),
  }
}

export const diff = createDiffHandler()

function getColor(annotation?: { query?: string }) {
  return annotation?.query == "-" ? "#f85149" : "#3fb950"
}
