"use client";

/**
 * Multi-step intake overlay for candidtutors.co/ "Get matched with a tutor".
 *
 * One file by design — the 6 steps are all just "ask a question, capture answer,
 * advance". Split-into-files (à la JoinForFree/) isn't justified here.
 *
 * Two presentations driven by Tailwind breakpoints (single mounted instance):
 *  - mobile (<lg): vaul Drawer bottom-sheet (top image, cream card below)
 *  - desktop (≥lg): centered modal-card over a blurred backdrop
 *
 * Cream palette deviates from the dark site theme — intentional (matches the
 * Fora Travel reference). The aesthetic shift makes the intake feel personal
 * vs. the rest of the marketing site.
 */

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { useMatchIntakeOpen, closeMatchIntake } from "@/lib/match-intake-store";
import { submit_match_request } from "@/lib/api";

// ── Step config ─────────────────────────────────────────────────────────

type Answers = {
  target_language?: "english" | "korean";
  level?: string;
  native_languages?: string[];
  focus_areas?: string[];
  details?: string;
};

const LEVEL_OPTIONS = [
  "Beginner",
  "Lower-intermediate",
  "Intermediate",
  "Upper-intermediate",
  "Advanced",
];

const NATIVE_OPTIONS = ["English", "Korean", "Spanish", "Mandarin", "Japanese"];

const FOCUS_OPTIONS = [
  "Speaking",
  "Listening",
  "Reading",
  "Vocabulary",
  "Grammar",
  "Not sure yet",
];

const TOTAL_QUESTION_STEPS = 6;
type Step = 1 | 2 | 3 | 4 | 5 | 6 | "success" | "error";

// ── Component ───────────────────────────────────────────────────────────

export default function MatchIntakeOverlay() {
  const open = useMatchIntakeOpen();
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [native_other, setNativeOther] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on close so reopening starts fresh (mirrors JoinForFreeSheet.tsx:27-34).
  useEffect(() => {
    if (!open) {
      setStep(1);
      setAnswers({});
      setNativeOther("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubmitting(false);
    }
  }, [open]);

  const can_advance = (() => {
    switch (step) {
      case 1: return !!answers.target_language;
      case 2: return !!answers.level;
      case 3: return (answers.native_languages?.length ?? 0) > 0 || native_other.trim().length > 0;
      case 4: return (answers.focus_areas?.length ?? 0) > 0;
      case 5: return true; // optional
      case 6: return first_name.trim().length > 0 && last_name.trim().length > 0 && is_valid_email(email);
      default: return false;
    }
  })();

  async function handle_next() {
    if (!can_advance || submitting) return;
    // step can also be "success" | "error" but the Next button is unmounted in those
    // states, so this handler only runs while step is numeric.
    if (typeof step !== "number") return;
    if (step < TOTAL_QUESTION_STEPS) {
      setStep((step + 1) as Step);
      return;
    }
    // Final step → submit
    setSubmitting(true);
    try {
      const merged_native = [
        ...(answers.native_languages ?? []),
        ...(native_other.trim() ? [native_other.trim()] : []),
      ];
      await submit_match_request({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        answers: { ...answers, native_languages: merged_native },
      });
      setStep("success");
    } catch (e) {
      console.error("submit_match_request failed", e);
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }

  function handle_back() {
    if (step === 1 || step === "success" || step === "error") return;
    setStep((step as number) - 1 as Step);
  }

  const body = (
    <OverlayBody
      step={step}
      answers={answers}
      setAnswers={setAnswers}
      native_other={native_other}
      setNativeOther={setNativeOther}
      first_name={first_name}
      setFirstName={setFirstName}
      last_name={last_name}
      setLastName={setLastName}
      email={email}
      setEmail={setEmail}
      can_advance={can_advance}
      submitting={submitting}
      handle_next={handle_next}
      handle_back={handle_back}
      onClose={closeMatchIntake}
      onRetry={() => setStep(TOTAL_QUESTION_STEPS)}
    />
  );

  return (
    <>
      {/* Mobile: vaul bottom-sheet.
          NOTE: vaul portals to document.body, so a parent `lg:hidden` wrapper
          does NOT hide the portaled content on desktop — the lg:hidden class
          must live on Overlay + Content themselves. */}
      <div className="lg:hidden">
        <Drawer.Root open={open} onOpenChange={(o) => { if (!o) closeMatchIntake(); }}>
          <Drawer.Portal>
            <Drawer.Overlay className="lg:hidden fixed inset-0 bg-black/40 z-[60]" />
            <Drawer.Content
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] flex flex-col rounded-t-3xl"
              style={{ maxHeight: "92vh", backgroundColor: "#F8F5EE" }}
            >
              <Drawer.Title className="sr-only">Get matched with a tutor</Drawer.Title>
              <Drawer.Description className="sr-only">A short intake to match you with a Candid tutor</Drawer.Description>
              {body}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* Desktop: centered modal. */}
      {open && (
        <div className="hidden lg:flex fixed inset-0 z-[70] items-center justify-center p-6 bg-black/40" onClick={closeMatchIntake}>
          <div
            className="w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            style={{ backgroundColor: "#F8F5EE" }}
            onClick={(e) => e.stopPropagation()}
          >
            {body}
          </div>
        </div>
      )}
    </>
  );
}

// ── Overlay body (shared between mobile + desktop) ──────────────────────

interface BodyProps {
  step: Step;
  answers: Answers;
  // Functional setter — rapid synchronous clicks (e.g. two pills in the same tick)
  // would otherwise read a stale `answers` closure and lose one selection.
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  native_other: string;
  setNativeOther: (s: string) => void;
  first_name: string;
  setFirstName: (s: string) => void;
  last_name: string;
  setLastName: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  can_advance: boolean;
  submitting: boolean;
  handle_next: () => void;
  handle_back: () => void;
  onClose: () => void;
  onRetry: () => void;
}

function OverlayBody(p: BodyProps) {
  const is_question_step = typeof p.step === "number";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top chrome: back / progress / close */}
      {is_question_step && (
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button
            type="button"
            onClick={p.handle_back}
            disabled={p.step === 1}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <span className="text-xl" style={{ color: "#18181C" }}>‹</span>
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm tabular-nums" style={{ color: "#666666" }}>{p.step}/{TOTAL_QUESTION_STEPS}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((p.step as number) / TOTAL_QUESTION_STEPS) * 100}%`, backgroundColor: "#18181C" }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={p.onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <span className="text-base" style={{ color: "#18181C" }}>✕</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
        {p.step === 1 && (
          <StepShell title="What language are you learning?" subtitle="We'll match you with a tutor who teaches it.">
            <PillGroup
              options={[{ value: "english", label: "English" }, { value: "korean", label: "Korean" }]}
              selected={p.answers.target_language ? [p.answers.target_language] : []}
              onToggle={(v) => p.setAnswers({ ...p.answers, target_language: v as "english" | "korean" })}
            />
          </StepShell>
        )}

        {p.step === 2 && (
          <StepShell title="What level are you at?" subtitle="Approximate is fine — your tutor will calibrate.">
            <PillGroup
              options={LEVEL_OPTIONS.map(l => ({ value: l, label: l }))}
              selected={p.answers.level ? [p.answers.level] : []}
              onToggle={(v) => p.setAnswers({ ...p.answers, level: v })}
            />
          </StepShell>
        )}

        {p.step === 3 && (
          <StepShell title="What's your native language?" subtitle="Pick all that apply.">
            <PillGroup
              options={NATIVE_OPTIONS.map(l => ({ value: l, label: l }))}
              selected={p.answers.native_languages ?? []}
              multi
              onToggle={(v) => p.setAnswers(prev => {
                const cur = prev.native_languages ?? [];
                const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
                return { ...prev, native_languages: next };
              })}
            />
            <input
              type="text"
              placeholder="Other (type here)"
              value={p.native_other}
              onChange={(e) => p.setNativeOther(e.target.value)}
              className="mt-4 w-full px-4 py-3 rounded-2xl text-base outline-none"
              style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#18181C" }}
            />
          </StepShell>
        )}

        {p.step === 4 && (
          <StepShell title="What do you want to focus on most?" subtitle="Pick all that apply.">
            <PillGroup
              options={FOCUS_OPTIONS.map(l => ({ value: l, label: l }))}
              selected={p.answers.focus_areas ?? []}
              multi
              onToggle={(v) => p.setAnswers(prev => {
                const cur = prev.focus_areas ?? [];
                const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
                return { ...prev, focus_areas: next };
              })}
            />
          </StepShell>
        )}

        {p.step === 5 && (
          <StepShell title="Anything else you'd like us to know?" subtitle="Optional — anything that'd help us match you well.">
            <textarea
              placeholder="e.g. I want to feel comfortable at work, or I'm preparing for a trip..."
              value={p.answers.details ?? ""}
              onChange={(e) => p.setAnswers({ ...p.answers, details: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-2xl text-base outline-none resize-none"
              style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#18181C" }}
            />
          </StepShell>
        )}

        {p.step === 6 && (
          <StepShell title="Where can your tutor contact you?" subtitle="We'll personally email you within 24 hours.">
            <div className="flex flex-col gap-3">
              <ContactInput placeholder="First name" value={p.first_name} onChange={p.setFirstName} />
              <ContactInput placeholder="Last name" value={p.last_name} onChange={p.setLastName} />
              <ContactInput placeholder="Email address" value={p.email} onChange={p.setEmail} type="email" />
            </div>
          </StepShell>
        )}

        {p.step === "success" && (
          <div className="px-2 py-10 text-center">
            <h2 className="text-3xl font-semibold mb-3" style={{ color: "#18181C" }}>Thanks — talk soon!</h2>
            <p className="text-base" style={{ color: "#666666" }}>We'll be in touch within 24 hours.</p>
            <button
              type="button"
              onClick={p.onClose}
              className="mt-8 px-6 py-3 rounded-full text-base font-semibold"
              style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
            >
              Close
            </button>
          </div>
        )}

        {p.step === "error" && (
          <div className="px-2 py-10 text-center">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "#18181C" }}>Something went wrong</h2>
            <p className="text-base mb-6" style={{ color: "#666666" }}>Couldn't send your request. Mind trying again?</p>
            <button
              type="button"
              onClick={p.onRetry}
              className="px-6 py-3 rounded-full text-base font-semibold"
              style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {is_question_step && (
        <div className="px-5 pb-6 pt-2">
          <button
            type="button"
            onClick={p.handle_next}
            disabled={!p.can_advance || p.submitting}
            className="w-full py-4 rounded-full text-base font-semibold transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: p.can_advance && !p.submitting ? "#18181C" : "rgba(0,0,0,0.08)",
              color: p.can_advance && !p.submitting ? "#FFFFFF" : "#999999",
            }}
          >
            {p.submitting ? "Sending…" : (p.step === TOTAL_QUESTION_STEPS ? "Submit" : "Next")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Small pieces ────────────────────────────────────────────────────────

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <h2 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: "#18181C" }}>{title}</h2>
      {subtitle && <p className="text-base mb-6" style={{ color: "#666666" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function PillGroup({
  options,
  selected,
  multi = false,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  multi?: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const is_selected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className="px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: is_selected ? "#18181C" : "#EFEAE0",
              color: is_selected ? "#FFFFFF" : "#18181C",
            }}
            aria-pressed={multi ? is_selected : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ContactInput({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-2xl text-base outline-none border"
      style={{ backgroundColor: "transparent", color: "#18181C", borderColor: "rgba(0,0,0,0.12)" }}
    />
  );
}

// Loose email regex — server validates strictly via zod. Client check is just to
// gate the Next button from obvious typos.
function is_valid_email(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
