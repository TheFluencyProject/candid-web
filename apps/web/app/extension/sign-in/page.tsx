import type { Metadata } from "next";
import { Suspense } from "react";
import ExtensionSignIn from "./ExtensionSignIn";

export const metadata: Metadata = {
  metadataBase: new URL("https://joincandid.co"),
  title: "Sign in to Candid",
  robots: { index: false, follow: false },
};

export default function ExtensionSignInPage() {
  return (
    <Suspense>
      <ExtensionSignIn />
    </Suspense>
  );
}
