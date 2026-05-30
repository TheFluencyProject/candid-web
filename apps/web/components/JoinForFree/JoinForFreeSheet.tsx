"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { useTranslations } from "next-intl";
import { useJoinForFreeOpen, closeJoinForFree } from "@/lib/join-for-free-store";
import SignInStep from "./SignInStep";
import SuccessStep from "./SuccessStep";

type Step = "signin" | "success" | "error";

interface Props {
  tutor_name: string;
  tutor_slug: string;
  locale: "en" | "ko";
}

export default function JoinForFreeSheet({ tutor_name, tutor_slug, locale }: Props) {
  const open = useJoinForFreeOpen();
  const t = useTranslations("join_for_free");
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState<string>("");
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Reset step + state on close so reopening starts fresh.
  useEffect(() => {
    if (!open) {
      setStep("signin");
      setEmail("");
      setAlreadyHasAccount(false);
      setErrorMessage("");
    }
  }, [open]);

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) closeJoinForFree(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[70] mt-24 flex flex-col rounded-t-3xl bg-white"
          style={{ maxHeight: "85vh" }}
        >
          <div className="mx-auto my-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: "#E0E0E0" }} />
          <Drawer.Title className="sr-only">{t("sheet_title")}</Drawer.Title>
          <Drawer.Description className="sr-only">{t("sheet_description", { name: tutor_name })}</Drawer.Description>

          {step === "signin" && (
            <SignInStep
              tutor_name={tutor_name}
              tutor_slug={tutor_slug}
              locale={locale}
              onSuccess={(e, already) => {
                setEmail(e);
                setAlreadyHasAccount(already);
                setStep("success");
              }}
              onError={(msg) => {
                setErrorMessage(msg);
                setStep("error");
              }}
            />
          )}

          {step === "success" && (
            <SuccessStep
              email={email}
              tutor_name={tutor_name}
              already_has_account={alreadyHasAccount}
              onClose={() => closeJoinForFree()}
            />
          )}

          {step === "error" && (
            <div className="px-6 pb-8 pt-2 text-center">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "#18181C" }}>
                {t("error_title")}
              </h2>
              <p className="text-base mb-6" style={{ color: "#666666" }}>{errorMessage}</p>
              <button
                type="button"
                onClick={() => setStep("signin")}
                className="w-full py-3 rounded-full text-base font-semibold"
                style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
              >
                {t("error_retry")}
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
