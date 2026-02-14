import { AnnotationHandler } from "codehike/code";

const skyColor = "var(--color-sky-500)";

export const mark: AnnotationHandler = {
  name: "mark",
  Block: ({ children }) => {
    return (
      <div
        style={{
          ["--dk-line-bg" as string]: `rgb(from ${skyColor} r g b / 0.13)`,
          ["--dk-line-border" as string]: skyColor,
        }}
      >
        {children}
      </div>
    );
  },
  Inline: ({ children }) => {
    return (
      <span
        style={{
          boxShadow: `0 0 0 1px rgb(from ${skyColor} r g b / 0.5)`,
          backgroundColor: `rgb(from ${skyColor} r g b / 0.13)`,
        }}
        className="rounded px-0.5 py-0 -mx-0.5"
      >
        {children}
      </span>
    );
  },
};
