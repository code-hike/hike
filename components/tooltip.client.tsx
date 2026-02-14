"use client"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNotesContext } from "./notes.client"
import { cn } from "@/lib/utils"

export function NoteTooltip({
  children,
  name,
}: {
  children: React.ReactNode
  name: string
}) {
  let note = useNotesContext(name)
  if (!note) {
    note = { name, type: "prose", children: name }
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline cursor-help border-b border-dotted border-current/60 leading-[inherit]">
            {children}
          </span>
        </TooltipTrigger>

        {note.type === "code" ? (
          <TooltipContent
            className={cn(
              "min-w-44 max-w-96 whitespace-normal",
              "p-0 overflow-hidden [&>div]:!my-0",
            )}
          >
            {note?.children}
          </TooltipContent>
        ) : note.type === "image" ? (
          <TooltipContent
            className={cn(
              "min-w-44 max-w-96 whitespace-normal",
              "p-2 [&>*]:first:mt-0 [&>*]:last:mb-0",
            )}
          >
            {note?.children}
          </TooltipContent>
        ) : (
          <TooltipContent
            className={cn("min-w-44 max-w-96 whitespace-normal", "p-4")}
          >
            <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
              {note?.children}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
