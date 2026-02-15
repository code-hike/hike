import { AnnotationHandler } from "codehike/code"
import { CodeOptions } from "./code.config"

import { line } from "./code.line"
import { mark } from "./mark"
import { callout } from "./callout"
import { tooltip } from "./tooltip"
import { tokenTransitions } from "./token-transitions"
import { createDiffHandler } from "./diff"

export function getHandlers(options: CodeOptions) {
  return [
    line,
    mark,
    callout,
    tooltip,
    createDiffHandler({ forceGutter: options.forceDiffGutter }),
    options.animate && tokenTransitions,
  ].filter(Boolean) as AnnotationHandler[]
}
