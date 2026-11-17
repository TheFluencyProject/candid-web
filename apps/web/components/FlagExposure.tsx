"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

// Manual experiment exposure: server-decide + client bootstrap skip the SDK's auto-tracking (see
// MobileCTABar), so the experiment needs us to record the variant ourselves — once per load.
// Deferred one task: a child effect runs before PostHogProvider's posthog.init effect, and a capture
// before init is dropped. `when` gates it (e.g. desktop only); no variant = not in the test, no exposure.
export function useFlagExposure(flag: string, variant: string | undefined, when: () => boolean = () => true) {
  const exposed = useRef(false);
  useEffect(() => {
    if (!variant || exposed.current || !when()) return;
    exposed.current = true;
    setTimeout(() => {
      posthog.capture("$feature_flag_called", {
        $feature_flag: flag,
        $feature_flag_response: variant,
      });
    }, 0);
    // `when` is read once, at mount; only a variant change re-runs this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag, variant]);
}

// For server pages that render an arm and have no client component of their own to call the hook from.
export default function FlagExposure({ flag, variant }: { flag: string; variant?: string }) {
  useFlagExposure(flag, variant);
  return null;
}
