"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeInfo } from "./code.config";

export function WalkClient(props: {
  group: CodeInfo;
  className?: string;
}) {
  const { group, className } = props;
  const totalSlides = group.tabs.length;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const current = group.tabs[currentIndex];

  const setSlide = React.useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(Math.max(nextIndex, 0), totalSlides - 1);
      setCurrentIndex(clamped);
    },
    [totalSlides],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSlide(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSlide(currentIndex + 1);
      }
    },
    [currentIndex, setSlide],
  );
  const preventFocusSteal = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    },
    [],
  );

  if (!current) {
    return null;
  }

  return (
    <div
      className={cn(
        "border rounded selection:bg-dk-selection selection:text-current border-dk-border overflow-hidden relative flex flex-col max-h-full min-h-0 my-4 gap-0 not-prose",
        "focus:outline-none focus-visible:outline-none focus-visible:shadow-[0_0_8px_2px_rgba(14,165,233,0.3)]",
        "scroll-my-8",
        className,
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "border-b-[1px] border-dk-border bg-dk-tabs-background px-3 py-0",
          "w-full h-9 flex items-center gap-3 shrink-0",
          "text-dk-tab-inactive-foreground text-sm font-mono",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 self-stretch">
          <div className="size-4 shrink-0 flex items-center justify-center">
            {current.icon}
          </div>
          <span className="truncate leading-tight h-full flex items-center">
            {current.title || `Slide ${currentIndex + 1}`}
          </span>
        </div>

        {totalSlides > 1 ? (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSlide(currentIndex - 1)}
              onMouseDown={preventFocusSteal}
              disabled={currentIndex === 0}
              tabIndex={-1}
              className={cn(
                "size-6 rounded text-dk-tab-inactive-foreground transition-colors",
                "hover:bg-dk-background hover:text-dk-tab-active-foreground",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="mx-auto size-3.5" strokeWidth={2} />
            </button>

            <div className="flex items-center gap-1" aria-label="Slide indicators">
              {group.tabs.map((tab, index) => (
                <button
                  key={`${tab.title || "slide"}-${index}`}
                  type="button"
                  onClick={() => setSlide(index)}
                  onMouseDown={preventFocusSteal}
                  tabIndex={-1}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    index === currentIndex
                      ? "bg-dk-tab-active-foreground"
                      : "bg-dk-tab-inactive-foreground/40 hover:bg-dk-tab-inactive-foreground/70",
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSlide(currentIndex + 1)}
              onMouseDown={preventFocusSteal}
              disabled={currentIndex === totalSlides - 1}
              tabIndex={-1}
              className={cn(
                "size-6 rounded text-dk-tab-inactive-foreground transition-colors",
                "hover:bg-dk-background hover:text-dk-tab-active-foreground",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="mx-auto size-3.5" strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex flex-col">
        <div className="grid [grid-template-areas:'stack']">
          <div
            className="grid [grid-area:stack] [grid-template-areas:'stack'] pointer-events-none select-none invisible"
            aria-hidden="true"
          >
            {group.tabs.map((tab, index) => {
              if (index === currentIndex) {
                return null;
              }
              return (
                <div
                  key={`measure-${tab.title || "slide"}-${index}`}
                  className="[grid-area:stack] min-w-0"
                >
                  {tab.pre}
                </div>
              );
            })}
          </div>

          <div className="[grid-area:stack] min-w-0 transition-opacity duration-150">
            {current.pre}
          </div>
        </div>
      </div>
    </div>
  );
}
