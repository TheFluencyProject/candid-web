"use client";

import { useState, useSyncExternalStore } from "react";
import type { Auth } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import AppleSignInButton from "@/components/JoinForFree/AppleSignInButton";
import GoogleSignInButton from "@/components/JoinForFree/GoogleSignInButton";
import { extension_auth_instance, is_popup_cancel, type SignInResult } from "@/lib/firebase";
import { APP_STORE_URL } from "@/lib/platform";

// Sign-in page for the Candid Chrome extension. Signs the learner in on an in-memory Firebase app
// (?env=dev picks the dev project) and hands the provider credential to the extension.

// Extension ids from env, never from the URL (a crafted link would hand the credential to another extension).
const EXTENSION_IDS = (process.env.NEXT_PUBLIC_CANDID_EXTENSION_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

type Provider = "apple" | "google";

interface SignInMessage {
  type: "candid_sign_in";
  provider: Provider;
  credential_json: object;
}

interface SignInReply {
  ok?: boolean;
  reason?: string;
}

// Minimal slice of the chrome.runtime API Chrome exposes to pages listed in an
// extension's externally_connectable.
interface ChromeRuntime {
  sendMessage: (extension_id: string, message: unknown, callback: (reply: unknown) => void) => void;
  lastError?: { message?: string };
}

declare global {
  interface Window {
    chrome?: { runtime?: ChromeRuntime };
  }
}

class ExtensionUnreachableError extends Error {}

function send_to_one(runtime: ChromeRuntime, extension_id: string, message: SignInMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      runtime.sendMessage(extension_id, message, (reply) => {
        const last_error = runtime.lastError;
        if (last_error) reject(new Error(last_error.message ?? "chrome.runtime.lastError"));
        else resolve(reply);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Sends to each configured id in turn; the first one that answers wins. */
async function send_to_extension(message: SignInMessage): Promise<unknown> {
  const runtime = typeof window !== "undefined" ? window.chrome?.runtime : undefined;
  if (!runtime?.sendMessage) throw new ExtensionUnreachableError("chrome.runtime.sendMessage unavailable");
  const failures: string[] = [];
  for (const extension_id of EXTENSION_IDS) {
    try {
      return await send_to_one(runtime, extension_id, message);
    } catch (e) {
      failures.push(`${extension_id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new ExtensionUnreachableError(failures.join("; ") || "NEXT_PUBLIC_CANDID_EXTENSION_IDS is empty");
}

const subscribe_noop = () => () => {};
const get_server_auth = (): Auth | null => null;

type PageState =
  | { kind: "idle"; error?: string }
  | { kind: "sending" }
  | { kind: "signed_in" }
  | { kind: "no_account"; email: string | null; provider: Provider }
  | { kind: "no_extension" };

const INK = "#18181C";
const MUTED = "rgba(255,255,255,0.6)";

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-semibold text-center mb-2 text-white">{children}</h1>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-center" style={{ color: MUTED }}>{children}</p>;
}

export default function ExtensionSignIn() {
  const env = useSearchParams().get("env") === "dev" ? "dev" : "prod";
  const [state, set_state] = useState<PageState>({ kind: "idle" });
  // Client-only: Firebase Auth can't initialize during server rendering.
  const auth = useSyncExternalStore(subscribe_noop, () => extension_auth_instance(env), get_server_auth);

  async function handle_success(result: SignInResult) {
    if (!result.credential_json) {
      set_state({ kind: "idle", error: "Sign-in didn't return a credential. Please try again." });
      return;
    }
    set_state({ kind: "sending" });
    let reply: SignInReply | undefined;
    try {
      reply = (await send_to_extension({
        type: "candid_sign_in",
        provider: result.provider,
        credential_json: result.credential_json,
      })) as SignInReply | undefined;
    } catch (e) {
      if (e instanceof ExtensionUnreachableError) {
        console.warn("extension unreachable", e.message);
        set_state({ kind: "no_extension" });
      } else {
        set_state({ kind: "idle", error: "Something went wrong. Please try again." });
      }
      return;
    }
    if (reply?.ok) set_state({ kind: "signed_in" });
    else if (reply?.reason === "no_candid_account") {
      set_state({ kind: "no_account", email: result.email, provider: result.provider });
    } else {
      console.warn("extension rejected sign-in", reply);
      set_state({ kind: "idle", error: "The extension couldn't sign you in. Please try again." });
    }
  }

  function handle_error(e: unknown) {
    if (is_popup_cancel(e)) return;
    console.warn("extension sign-in failed", e);
    set_state({ kind: "idle", error: "Sign-in failed. Please try again." });
  }

  const busy = state.kind === "sending" || !auth;

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24"
      style={{ backgroundColor: INK }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/wordmark-white.svg" alt="Candid" className="absolute top-6 left-6 h-7" />
      <div className="w-full max-w-sm rounded-3xl px-6 py-8" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        {state.kind === "signed_in" ? (
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: "#E8F8EE" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A8E3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Title>You&apos;re in</Title>
            <Body>This tab will close by itself.</Body>
          </div>
        ) : state.kind === "no_account" ? (
          <div>
            <Title>No Candid account yet</Title>
            <Body>
              Sign up in the Candid app with this same {state.provider === "apple" ? "Apple" : "Google"} login
              {state.email ? ` (${state.email})` : ""}, then come back.
            </Body>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block w-full py-3 rounded-full text-base font-semibold text-center"
              style={{ backgroundColor: "#FFFFFF", color: INK }}
            >
              Get Candid on the App Store
            </a>
          </div>
        ) : state.kind === "no_extension" ? (
          <div>
            <Title>Install the Candid extension first</Title>
            <Body>Then open it from Chrome&apos;s toolbar and tap Sign in.</Body>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <Title>Sign in to Candid</Title>
            </div>
            <div className="flex flex-col gap-3">
              <AppleSignInButton
                label="Continue with Apple"
                onSuccess={handle_success}
                onError={handle_error}
                disabled={busy}
                auth={auth ?? undefined}
              />
              <GoogleSignInButton
                label="Continue with Google"
                onSuccess={handle_success}
                onError={handle_error}
                disabled={busy}
                auth={auth ?? undefined}
              />
            </div>
            {state.kind === "idle" && state.error && (
              <p className="text-sm text-center mt-4" style={{ color: "#FF8A80" }}>{state.error}</p>
            )}
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-6 text-sm text-center underline"
              style={{ color: MUTED }}
            >
              Don&apos;t have the app?
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
