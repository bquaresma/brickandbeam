"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/actions/action-result";

// Wraps a Server Action that returns `ActionResult` with useActionState so
// validation failures (a return, not a throw) render as an inline message
// instead of crashing to the nearest error boundary.
export function FormWithError({
  action,
  className,
  errorClassName = "mt-2 w-full text-sm text-red-600",
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  errorClassName?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async (_prevState, formData) => (await action(formData)) ?? undefined,
    undefined,
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className={errorClassName}>{state.error}</p>}
    </form>
  );
}

// Reads pending state from the nearest ancestor <form> via useFormStatus,
// so it drops into any FormWithError (or plain action-bound form) as-is.
export function SubmitButton({
  children,
  pendingLabel,
  className,
  style,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className} style={style}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
