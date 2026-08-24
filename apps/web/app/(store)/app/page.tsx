import type { Metadata } from "next";
import { APP_STORE_URL } from "@/lib/platform";
import StoreRedirect from "@/components/StoreRedirect";

// Vanity alias for /join — same bare App Store URL, no ppid. Renders the escape page rather than
// redirecting for the same reason /join does: a 30x to apps.apple.com inside a social webview
// dead-ends there. Kept behaviourally identical to /join so it doesn't matter which alias someone
// happens to paste into a bio or DM.
export const metadata: Metadata = {
  title: "Candid",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <StoreRedirect storeUrl={APP_STORE_URL} />;
}
