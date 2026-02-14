import { AnnotationHandler } from "codehike/code"
import { CodeOptions } from "./code.config"

import { line } from "./code.line"
import { mark } from "./mark"
import { callout } from "./callout"
import { tooltip } from "./tooltip"
import { tokenTransitions } from "./token-transitions"

export function getHandlers(options: CodeOptions) {
  return [
    line,
    mark,
    callout,
    tooltip,
    options.animate && tokenTransitions,
  ].filter(Boolean) as AnnotationHandler[]
}
