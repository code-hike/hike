import { AnnotationHandler } from "codehike/code"
import { CodeOptions } from "./code.config"

import { line } from "./code.line"
import { mark } from "./mark"
import { callout } from "./callout"
import { tooltip } from "./tooltip"
import { tokenTransitions } from "./token-transitions"
import { createDiffHandler } from "./diff"
import { wordWrap } from "./word-wrap"

export function getHandlers(options: CodeOptions) {
  return [
    line,
    mark,
    callout,
    tooltip,
    createDiffHandler({ forceGutter: options.forceDiffGutter }),
    options.wordWrap && wordWrap,
    options.animate && tokenTransitions,
  ].filter(Boolean) as AnnotationHandler[]
}
