import AnonAnalytics from "@/components/AnonAnalytics";

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <AnonAnalytics>{children}</AnonAnalytics>
      </body>
    </html>
  );
}
