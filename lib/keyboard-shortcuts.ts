"use client";

import { useEffect } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

type Shortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key === shortcut.key || e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler(e);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
}

