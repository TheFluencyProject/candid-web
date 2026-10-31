"use client";

import { useEffect, useState } from "react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
import { submit_android_waitlist, type AndroidWaitlistSurface } from "@/lib/api";

// Candid is iOS-only, so an Android Download tap would land on an App Store page it can't
// install from. DownloadQRInterceptor opens this instead: one email field, then a thank-you.
//
// Copy lives here rather than in messages/*.json because /lesson/[id] mounts the interceptor
// outside the [locale] group (no translation context), and the site only ships en + ko while
// Android visitors can be any of the app's languages — so the language comes from the phone.
type Copy = { title: string; placeholder: string; button: string; success: string; error: string };

const COPY: Record<string, Copy> = {
  en: {
    title: "Join the waitlist for Candid Android",
    placeholder: "you@email.com",
    button: "Join waitlist",
    success: "You're on the list! We'll email you when Candid is on Android.",
    error: "Something went wrong",
  },
  ko: {
    title: "Candid 안드로이드 대기자 명단에 등록하세요",
    placeholder: "you@email.com",
    button: "대기자 명단 등록",
    success: "등록되었어요! Candid가 안드로이드에 출시되면 이메일로 알려드릴게요.",
    error: "문제가 발생했어요",
  },
  ja: {
    title: "Candid Android版のウェイトリストに登録",
    placeholder: "you@email.com",
    button: "ウェイトリストに登録",
    success: "登録しました！Candid が Android に対応したらメールでお知らせします。",
    error: "問題が発生しました",
  },
  zh: {
    title: "加入 Candid 安卓版候补名单",
    placeholder: "you@email.com",
    button: "加入候补名单",
    success: "你已加入名单！Candid 安卓版上线时我们会发邮件通知你。",
    error: "出错了",
  },
  es: {
    title: "Únete a la lista de espera de Candid para Android",
    placeholder: "you@email.com",
    button: "Unirme a la lista",
    success: "¡Ya estás en la lista! Te avisaremos por correo cuando Candid esté en Android.",
    error: "Algo salió mal",
  },
  ru: {
    title: "Запишитесь в лист ожидания Candid для Android",
    placeholder: "you@email.com",
    button: "Записаться",
    success: "Вы в списке! Мы напишем вам, когда Candid появится на Android.",
    error: "Что-то пошло не так",
  },
  fr: {
    title: "Rejoignez la liste d'attente de Candid pour Android",
    placeholder: "you@email.com",
    button: "Rejoindre la liste",
    success: "Vous êtes sur la liste ! Nous vous écrirons dès que Candid sera disponible sur Android.",
    error: "Une erreur s'est produite",
  },
  vi: {
    title: "Đăng ký danh sách chờ Candid cho Android",
    placeholder: "you@email.com",
    button: "Tham gia danh sách chờ",
    success: "Bạn đã có tên trong danh sách! Chúng tôi sẽ gửi email khi Candid có mặt trên Android.",
    error: "Đã xảy ra lỗi",
  },
  th: {
    title: "ลงชื่อรอใช้ Candid บน Android",
    placeholder: "you@email.com",
    button: "ลงชื่อรอ",
    success: "คุณอยู่ในรายชื่อแล้ว! เราจะส่งอีเมลแจ้งเมื่อ Candid พร้อมใช้งานบน Android",
    error: "เกิดข้อผิดพลาด",
  },
  id: {
    title: "Gabung daftar tunggu Candid untuk Android",
    placeholder: "you@email.com",
    button: "Gabung daftar tunggu",
    success: "Kamu sudah masuk daftar! Kami akan mengirim email saat Candid tersedia di Android.",
    error: "Terjadi kesalahan",
  },
};

// "ko-KR" → ko, "zh-Hans-CN" → zh; anything the app doesn't speak falls back to English.
function pickCopy(): Copy {
  const lang = (typeof navigator === "undefined" ? "" : navigator.language).toLowerCase().split("-")[0];
  return COPY[lang] ?? COPY.en;
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

  const copy = pickCopy();

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
      open={open}
      onClose={onClose}
      keyboardInset={kbdInset}
      blurBackdrop
      panelBackground="#FFFFFF"
      desktopMaxWidthClass="max-w-[400px]"
    >
      {state === "done" ? (
        <div className="px-8 py-10 text-center">
          <p className="text-lg font-semibold" style={{ color: "#18181C" }}>{copy.success}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-8 py-8 flex flex-col gap-4 text-center">
          <h2 className="text-xl font-semibold" style={{ color: "#18181C" }}>{copy.title}</h2>
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
            className="w-full px-4 py-3 rounded-2xl text-base outline-none border"
            style={{ backgroundColor: "transparent", color: "#18181C", borderColor: "rgba(0,0,0,0.12)" }}
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full py-4 rounded-full text-base font-semibold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
          >
            {copy.button}
          </button>
          {state === "error" && (
            <p className="text-sm" style={{ color: "#B42318" }}>{copy.error}</p>
          )}
        </form>
      )}
    </ResponsiveOverlay>
  );
}
