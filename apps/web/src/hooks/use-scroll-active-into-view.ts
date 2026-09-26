"use client";

import { useEffect, useRef } from "react";

/**
 * For horizontally scrolling nav rows (settings tabs, activation steps on
 * phones): brings the `aria-current` item into view whenever `key` changes,
 * so the active tab is never stranded off-screen to the right.
 */
export function useScrollActiveIntoView<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>("[aria-current]")
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [key]);
  return ref;
}
