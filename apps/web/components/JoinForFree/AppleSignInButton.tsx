"use client";

import { sign_in_with_apple, type SignInResult } from "@/lib/firebase";

interface Props {
  label: string;
  onSuccess: (result: SignInResult) => void;
  onError: (error: unknown) => void;
  disabled?: boolean;
}

export default function AppleSignInButton({ label, onSuccess, onError, disabled }: Props) {
  const onClick = async () => {
    try {
      const result = await sign_in_with_apple();
      onSuccess(result);
    } catch (e) {
      // Apple cancellation surfaces as a Firebase error code — caller decides UX.
      onError(e);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-base font-semibold transition-opacity disabled:opacity-50"
      style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
    >
      <svg width="18" height="22" viewBox="0 0 18 22" fill="currentColor" aria-hidden="true">
        <path d="M14.5 11.1c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.2.9-4 2.4-1.7 3-.4 7.4 1.2 9.9.8 1.2 1.8 2.5 3.1 2.5 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.4-2.7 1.4-2.8 0 0-2.7-1-2.8-4.1zM12.2 4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
      </svg>
      {label}
    </button>
  );
}
