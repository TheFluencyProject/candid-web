import type { Metadata } from "next";
import { APP_STORE_URL, androidWaitlistPath } from "@/lib/platform";

export const metadata: Metadata = {
  metadataBase: new URL("https://joincandid.co"),
  title: "Candid",
  description:
    "Learn English with real YouTube videos on Candid. Download the app to start watching.",
  openGraph: {
    type: "website",
    title: "Candid",
    description:
      "Learn English with real YouTube videos on Candid. Download the app to start watching.",
    siteName: "Candid",
    images: [{ url: "/SS-AppStore-Learn-EN.png", width: 1284, height: 2778, alt: "Candid" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Candid",
    description:
      "Learn English with real YouTube videos on Candid. Download the app to start watching.",
  },
};

export default function VideosPage() {
  // Android can't install from the App Store: our waitlist form instead (lib/platform androidWaitlistPath).
  const redirectScript = `
    var ua = navigator.userAgent;
    var dest = /Android/.test(ua) ? ${JSON.stringify(androidWaitlistPath({ from: "videos" }))} : ${JSON.stringify(APP_STORE_URL)};
    window.location.replace(dest);
  `;

  return (
    <>
      <main
        style={{
          backgroundColor: "#18181C",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.125rem", color: "#9ca3af" }}>
          Redirecting…
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
          <a
            href={APP_STORE_URL}
            style={{ color: "#9ca3af", textDecoration: "underline" }}
          >
            Tap here if you are not redirected
          </a>
        </p>
      </main>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
    </>
  );
}
