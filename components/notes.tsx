import { RawCode } from "codehike/code"
import { SingleCode, toCodeGroup } from "./code"
import { WithClientNotes } from "./notes.client"

export function WithNotes({
  children,
  ...rest
}: {
  children: React.ReactNode
}) {
  const notes = Object.entries(rest)
    .filter(([name]) => name !== "title" && name !== "_data")
    .map(([name, block]: any) => {
      if (block.hasOwnProperty("children")) {
        return {
          name,
          type: block.type || "prose",
          children: block.children,
        }
      } else if (
        block.hasOwnProperty("value") &&
        block.hasOwnProperty("lang")
      ) {
        return {
          name,
          type: "code" as const,
          children: <NoteCode codeblock={block} />,
        }
      } else if (block.hasOwnProperty("url") && block.hasOwnProperty("alt")) {
        return {
          name,
          type: "image" as const,
          children: <img src={block.url} alt={block.alt} />,
        }
      } else {
        throw new Error("Invalid block inside <WithNotes />")
      }
    })
  return <WithClientNotes notes={notes}>{children}</WithClientNotes>
}

async function NoteCode({ codeblock }: { codeblock: RawCode }) {
  const group = await toCodeGroup({ codeblocks: [codeblock] })
  return <SingleCode group={group} />
}
