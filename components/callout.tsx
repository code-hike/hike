import { AnnotationHandler, CodeAnnotation, InnerLine } from "codehike/code";
import { CalloutClient } from "./callout.client";

const skyColor = "var(--color-sky-500)";
const skyBorderColor = `var(--color-sky-500)`;

export const callout: AnnotationHandler = {
  name: "callout",
  Block: ({ children }) => (
    <div
      style={{
        ["--dk-line-bg" as string]: `rgb(from ${skyColor} r g b / 0.13)`,
        ["--dk-line-border" as string]: skyColor,
      }}
    >
      {children}
    </div>
  ),
  transform: (annotation: CodeAnnotation) => {
    if (!("fromColumn" in annotation)) {
      return annotation;
    }

    // transform inline annotation to block annotation
    const { name, query, lineNumber, fromColumn, toColumn } = annotation;
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: {
        ...annotation.data,
        column: (fromColumn + toColumn) / 2,
      },
    };
  },
  AnnotatedLine: ({ annotation, ...props }) => {
    const { indentation, children, lineNumber } = props;
    const isLastAnnotatedLine = lineNumber === annotation.toLineNumber;

    if (!isLastAnnotatedLine) {
      return <InnerLine merge={props} />;
    }

    const rawColumn = annotation.data?.column;
    const column = typeof rawColumn === "number" ? rawColumn : indentation + 2;
    const pointerOffset = Math.max(column - indentation - 1, 0);

    return (
      <InnerLine merge={props}>
        {children}
        <div className="-mx-3 px-3 py-1.5">
          <div
            style={{
              minWidth: `${column + 4}ch`,
              marginLeft: `${indentation}ch`,
              border: `1px solid ${skyBorderColor}`,
            }}
            className="w-fit bg-white rounded px-0 relative whitespace-break-spaces select-none"
          >
            <div
              style={{
                left: `${pointerOffset}ch`,
                borderColor: skyBorderColor,
              }}
              className="absolute border-l border-t  w-2 h-2 rotate-45 -translate-y-1/2 -top-[1px] bg-white"
            />
            <CalloutClient name={annotation.query} />
          </div>
        </div>
      </InnerLine>
    );
  },
};
