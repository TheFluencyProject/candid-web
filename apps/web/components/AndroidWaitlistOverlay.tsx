"use client";

import { useEffect, useState } from "react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
import { isLocale, routing, type Locale } from "@/i18n/routing";
import { submit_android_waitlist, type AndroidWaitlistSurface } from "@/lib/api";
import { isAndroid } from "@/lib/in-app-browser";

// Candid is iOS-only, so an Android Download tap would land on an App Store page it can't
// install from. DownloadQRInterceptor opens this instead: one email field, then a thank-you.
//
// Strings live in messages/<locale>.json under `android_waitlist`, but are loaded here rather
// than through next-intl: /lesson/[id] mounts the interceptor outside the [locale] group (no
// translation context), and the phone's language beats the page's — a /tutor link opens in
// English for everyone. Loaded once on Android only, long before anyone taps Download.
type Copy = { title: string; placeholder: string; button: string; success: string; error: string };

// "ko-KR" → ko, "zh-Hans-CN" → zh; anything the site doesn't speak falls back to English.
function phoneLocale(): Locale {
  const lang = (typeof navigator === "undefined" ? "" : navigator.language).toLowerCase().split("-")[0];
  return isLocale(lang) ? lang : routing.defaultLocale;
}

function useWaitlistCopy(): Copy | null {
  const [copy, setCopy] = useState<Copy | null>(null);
  useEffect(() => {
    if (!isAndroid()) return;
    import(`@/messages/${phoneLocale()}.json`)
      .catch(() => import("@/messages/en.json"))
      .then((m) => setCopy(m.default.android_waitlist as Copy));
  }, []);
  return copy;
}

export type AndroidWaitlistTarget = { tutor_slug: string; surface: AndroidWaitlistSurface };

export default function AndroidWaitlistOverlay({
  target,
  onClose,
}: {
  target: AndroidWaitlistTarget | null;
  onClose: () => void;
}) {
  const open = target !== null;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  // Fresh form each time it opens (a second tap after joining shows the form again, which
  // the backend treats as a no-op).
  useEffect(() => {
    if (open) setState("idle");
  }, [open]);

  // Lifts the sheet above the keyboard: fixed bottom:0 tracks the layout viewport, which the
  // keyboard doesn't shrink (same math as MatchIntakeOverlay).
  const [kbdInset, setKbdInset] = useState(0);
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setKbdInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  const copy = useWaitlistCopy();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || state === "sending") return;
    setState("sending");
    try {
      await submit_android_waitlist({
        email: email.trim(),
        tutor_slug: target.tutor_slug || null,
        surface: target.surface,
        locale: navigator.language || null,
      });
      setState("done");
    } catch (err) {
      console.error("submit_android_waitlist failed", err);
      setState("error");
    }
  }

  return (
    <ResponsiveOverlay
      open={open && copy !== null}
      onClose={onClose}
      keyboardInset={kbdInset}
      blurBackdrop
      panelBackground="#18181C"
      desktopMaxWidthClass="max-w-[400px]"
    >
      {copy && (state === "done" ? (
        <div className="px-8 py-10 text-center">
          <p className="text-lg text-white">{copy.success}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-8 py-8 flex flex-col gap-4 text-center">
          {/* Site theme: dark panel, light-weight white type, mint pill CTA (matches the hero). */}
          <h2 className="text-2xl font-normal tracking-tight text-white">{copy.title}</h2>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder={copy.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-3.5 rounded-full text-base text-white placeholder:text-gray-500 bg-white/5 border border-white/15 outline-none focus:border-[#89FFB4]/60"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full py-3.5 rounded-full bg-[#89FFB4] text-base font-semibold text-[#18181C] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {copy.button}
          </button>
          {state === "error" && (
            <p className="text-sm text-[#FF8A8A]">{copy.error}</p>
          )}
        </form>
      ))}
    </ResponsiveOverlay>
  );
}
