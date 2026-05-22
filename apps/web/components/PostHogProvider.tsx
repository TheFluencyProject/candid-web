"use client";

import posthog from "posthog-js";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  posthog.init("phc_z63G96rjoQ69KcCvirgWCd65MTRWu8ihGEs24ugqmiAF", {
    api_host: "https://us.i.posthog.com",
    // Manual capture below — auto fires before App Router updates the URL on SPA nav
    capture_pageview: false,
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageviewTracker />
      {children}
    </>
  );
}
