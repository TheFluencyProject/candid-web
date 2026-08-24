// Top-level routes live outside /[locale], whose layout supplies <html>/<body>, so this route
// provides its own (mirrors app/desktop/layout.tsx). The route group shares it across every
// vanity path that renders the escape page, so adding one is a page file and a middleware flag.
//
// No AnonAnalytics here, unlike the sibling layouts: these paths aren't in the middleware's
// ANON_ANALYTICS_ROUTES, so there's no candid_did cookie to read and AnonAnalytics would register a
// fresh PostHog person on every single bio tap. Stamping the cookie would mean a Set-Cookie on the
// response, which takes these pages off the edge cache — and they sit on the critical path of every
// tap. Left out deliberately; see the note in middleware.ts.
export default function StoreEscapeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
