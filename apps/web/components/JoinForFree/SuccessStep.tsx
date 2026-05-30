"use client";

import { useTranslations } from "next-intl";

interface Props {
  email: string;
  tutor_name: string;
  already_has_account: boolean;
  onClose: () => void;
}

export default function SuccessStep({ email, tutor_name, already_has_account, onClose }: Props) {
  const t = useTranslations("join_for_free");

  return (
    <div className="px-6 pb-8 pt-2 text-center">
      <div className="mx-auto mb-4 flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: "#E8F8EE" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A8E3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "#18181C" }}>
        {already_has_account ? t("success_already_title") : t("success_title")}
      </h2>
      <p className="text-base mb-6" style={{ color: "#666666" }}>
        {already_has_account
          ? t("success_already_subtitle", { name: tutor_name })
          : t("success_subtitle", { email })}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-full text-base font-semibold"
        style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
      >
        {t("success_close")}
      </button>
    </div>
  );
}
