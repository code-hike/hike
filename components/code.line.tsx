import { AnnotationHandler, InnerLine } from "codehike/code"

export const line: AnnotationHandler = {
  name: "line",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Line: ({ annotation, ...props }) => {
    return (
      <div
        style={{
          borderLeftColor: "var(--dk-line-border, transparent)",
          backgroundColor: "var(--dk-line-bg, transparent)",
          animation: "line-bg-enter 300ms ease-out 400ms backwards",
        }}
        className="flex border-l-2 border-l-transparent"
      >
        <InnerLine merge={props} className="px-3 flex-1" />
      </div>
    )
  },
}
