"use client";

/**
 * Tiny external-store singleton for the Join-for-free sheet's open/close.
 *
 * The guide page is a Server Component and can't hold state. Avoid React
 * Context + provider wrappers (would force the page to become client-rendered).
 * Both the navbar pill and the mobile sticky CTA call openJoinForFree();
 * <JoinForFreeSheet/> subscribes via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react";

let is_open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function get_snapshot(): boolean {
  return is_open;
}

function get_server_snapshot(): boolean {
  // SSR + first hydration must agree, otherwise React tears the tree.
  return false;
}

export function openJoinForFree(): void {
  if (is_open) return;
  is_open = true;
  emit();
}

export function closeJoinForFree(): void {
  if (!is_open) return;
  is_open = false;
  emit();
}

export function useJoinForFreeOpen(): boolean {
  return useSyncExternalStore(subscribe, get_snapshot, get_server_snapshot);
}
