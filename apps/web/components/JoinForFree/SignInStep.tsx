"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import AppleSignInButton from "./AppleSignInButton";
import GoogleSignInButton from "./GoogleSignInButton";
import { submit_web_signup } from "@/lib/api";
import type { SignInResult } from "@/lib/firebase";

interface Props {
  tutor_name: string;
  tutor_slug: string;
  locale: "en" | "ko";
  onSuccess: (email: string, already_has_account: boolean) => void;
  onError: (message: string) => void;
}

export default function SignInStep({ tutor_name, tutor_slug, locale, onSuccess, onError }: Props) {
  const t = useTranslations("join_for_free");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async (result: SignInResult) => {
    if (!result.email) {
      onError(t("error_no_email"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await submit_web_signup({
        id_token: result.id_token,
        tutor_slug,
        display_name: result.display_name,
        locale,
        auth_provider: result.provider,
      });
      onSuccess(result.email, res.already_has_account);
    } catch (e) {
      console.error("submit_web_signup failed", e);
      onError(t("error_signup_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderError = (e: unknown) => {
    // Apple/Google popup cancellation is the common case — silent dismiss is friendlier than an error.
    const code = (e as { code?: string })?.code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
    console.error("provider sign-in failed", e);
    onError(t("error_signin_failed"));
  };

  return (
    <div className="px-6 pb-8 pt-2">
      <h2 className="text-2xl font-semibold mb-2 text-center" style={{ color: "#18181C" }}>
        {t("signin_step_title", { name: tutor_name })}
      </h2>
      <p className="text-sm text-center mb-6" style={{ color: "#666666" }}>
        {t("signin_step_subtitle")}
      </p>
      <div className="flex flex-col gap-3">
        <AppleSignInButton
          label={t("signin_continue_with_apple")}
          onSuccess={handleSignIn}
          onError={handleProviderError}
          disabled={submitting}
        />
        <GoogleSignInButton
          label={t("signin_continue_with_google")}
          onSuccess={handleSignIn}
          onError={handleProviderError}
          disabled={submitting}
        />
      </div>
    </div>
  );
}
