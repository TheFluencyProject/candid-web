"use client";

import posthog from "posthog-js";
import { usePathname } from "next/navigation";
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

function PageviewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!initialized) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);
  return null;
}

export function PostHogProvider({ children, distinctId, bootstrapFlags }: Props) {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Manual capture inside PageviewTracker — autocapture fires before App Router updates the URL on SPA nav.
      capture_pageview: false,
      bootstrap: {
        distinctID: distinctId,
        isIdentifiedID: false,
        featureFlags: bootstrapFlags,
      },
    });
  }, [distinctId, bootstrapFlags]);

  return (
    <>
      <PageviewTracker />
      {children}
    </>
  );
}
