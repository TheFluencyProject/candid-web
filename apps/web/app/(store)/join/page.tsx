import type { Metadata } from "next";
import { APP_STORE_URL } from "@/lib/platform";
import StoreRedirect from "@/components/StoreRedirect";

// Instagram-bio and SMS onboarding entry point (the linq webhook + auto-reply both send
// joincandid.co/join). Deliberately a rendered page, not a middleware redirect: a 30x to
// apps.apple.com inside a social webview dead-ends there, so the hop out to the system browser has
// to run as JS on a page we serve. Kept static (no headers()/cookies()) — this is on the critical
// path of every tap, so it must come off the edge cache.

export const metadata: Metadata = {
  title: "Candid",
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  return <StoreRedirect storeUrl={APP_STORE_URL} />;
}
