import AnonAnalytics from "@/components/AnonAnalytics";

export default function LessonLayout({
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
        <AnonAnalytics desktopCta lessonSections>{children}</AnonAnalytics>
      </body>
    </html>
  );
}
