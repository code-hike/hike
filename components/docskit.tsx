import React from "react"
import { DocsKitCode } from "./code"
import { TooltipLink } from "./tooltip"
import { WithNotes } from "./notes"
import { Walk } from "./walk"

export function addDocsKit<
  T extends Record<string, React.ElementType | string>,
>(components: T): T {
  return {
    ...components,
    DocsKitCode,
    WithNotes,
    Walk,
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (props.href?.startsWith("tooltip:")) {
        return <TooltipLink {...props} />
      }
      return React.createElement(components?.a || "a", props)
    },
  }
}
