import "server-only";
import { ApiError } from "@napayment/api-client";

/** What a form's server action hands back to useActionState. */
export interface ActionState {
  error?: string;
  ok?: boolean;
  /** Success text computed by the action (e.g. how many settings it cleared); overrides the form's default. */
  message?: string;
}

/**
 * Runs a server action body, turning a backend rejection (409 wrong state,
 * 400 validation, 403 permission) into a message for the form rather than an
 * error page. Anything else - including Next's redirect() - is rethrown.
 */
export async function toActionState(run: () => Promise<void | string>): Promise<ActionState> {
  try {
    const message = await run();
    return message ? { ok: true, message } : { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.details[0] ?? error.message };
    throw error;
  }
}
