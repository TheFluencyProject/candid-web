"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog-config";

// Survives React Fast Refresh + StrictMode double-mounts; posthog.init must only run once per browser load.
let initialized = false;

type Props = {
  children: React.ReactNode;
  distinctId: string;
  // Server-decided flag values injected at first render so the client SDK
  // resolves the same variant without a post-mount swap.
  bootstrapFlags: Record<string, string | boolean>;
};

export function PostHogProvider({ children, distinctId, bootstrapFlags }: Props) {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // SDK-native SPA tracking: one $pageview per pushState/replaceState/popstate, with the URL
      // already updated. Replaces the old manual tracker component, which sat as a CHILD of this
      // provider — React runs child effects before parent effects, so it ran before init() and its
      // first-load capture was dropped. That silently cost us every single-page session (web
      // analytics read 1 visitor/week).
      capture_pageview: "history_change",
      bootstrap: {
        distinctID: distinctId,
        isIdentifiedID: false,
        featureFlags: bootstrapFlags,
      },
    });
    // The landing pageview is ours to send: the SDK's own init-time capture does not fire when it
    // boots from an effect (post-hydration), and history_change only covers navigations AFTER this
    // one. Confirmed against PostHog debug logs — without this line a bounce produces zero events.
    posthog.capture("$pageview");
  }, [distinctId, bootstrapFlags]);

  return <>{children}</>;
}
