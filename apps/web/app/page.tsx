import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between px-8 py-7"
      style={{
        backgroundColor: "#131212",
      }}
    >
      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          {/* App Icon */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/englishmode.svg"
              alt="English Mode Logo"
              width={150}
              height={260}
              priority
            />
          </div>

          {/* Tagline */}
          <p
            className="text-3xl mb-12"
            style={{
              fontWeight: 300,
              color: "#FFFFFF",
            }}
          >
            Replace scrolling with<br className="md:hidden" /> English immersion
          </p>

          {/* Download button */}
          <Link href="/join" className="inline-block">
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={170}
              height={55}
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>
      </div>

      {/* Footer links */}
      <footer className="flex gap-8 items-center justify-center">
        <Link
          href="/privacy"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          Terms of Use
        </Link>
        <Link
          href="/youtube-videos"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          YouTube Videos
        </Link>
      </footer>
    </main>
  );
}
