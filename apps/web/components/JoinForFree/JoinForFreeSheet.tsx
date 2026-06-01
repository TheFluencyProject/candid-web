"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useJoinForFreeOpen, closeJoinForFree } from "@/lib/join-for-free-store";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
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
    <ResponsiveOverlay open={open} onClose={closeJoinForFree}>
      {/* Mobile drag indicator — keeps the bottom-sheet affordance from the prior vaul implementation. */}
      <div className="lg:hidden mx-auto my-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: "#E0E0E0" }} />

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
          onClose={closeJoinForFree}
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
    </ResponsiveOverlay>
  );
}
