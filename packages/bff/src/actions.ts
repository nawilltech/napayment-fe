import "server-only";
import { ApiError } from "@napayment/api-client";

/** What a form's server action hands back to useActionState. */
export interface ActionState {
  error?: string;
  ok?: boolean;
}

/**
 * Runs a server action body, turning a backend rejection (409 wrong state,
 * 400 validation, 403 permission) into a message for the form rather than an
 * error page. Anything else - including Next's redirect() - is rethrown.
 */
export async function toActionState(run: () => Promise<void>): Promise<ActionState> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.details[0] ?? error.message };
    throw error;
  }
}
