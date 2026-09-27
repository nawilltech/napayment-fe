import "server-only";
import { NextResponse } from "next/server";
import { ApiError, CLIENT_ERROR_MESSAGES, ErrorCode, HTTP_STATUS } from "@napayment/api-client";
import type { ZodSchema } from "zod";

/** A BFF route with no signed-in session - thrown by authedBackendClient(), answered with a 401. */
export class NotAuthenticatedError extends Error {
  constructor() {
    super(CLIENT_ERROR_MESSAGES.notAuthenticated);
    this.name = "NotAuthenticatedError";
  }
}

export class ValidationError extends Error {
  details: string[];
  constructor(details: string[]) {
    super(details[0] ?? CLIENT_ERROR_MESSAGES.invalidInput);
    this.details = details;
  }
}

/** The one error body shape every BFF route returns - the backend's ErrorResponse fields the apps read. */
export function errorResponse(errorCode: ErrorCode, message: string, status: number, details: string[] = []) {
  return NextResponse.json({ errorCode, message, details }, { status });
}

export function notAuthenticatedResponse() {
  return errorResponse(ErrorCode.UNAUTHENTICATED, CLIENT_ERROR_MESSAGES.notAuthenticated, HTTP_STATUS.UNAUTHORIZED);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return errorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST, error.details);
  }
  if (error instanceof ApiError) {
    return errorResponse(error.errorCode, error.message, error.status, error.details);
  }
  if (error instanceof NotAuthenticatedError) {
    return notAuthenticatedResponse();
  }
  console.error(error);
  return errorResponse(ErrorCode.INTERNAL_ERROR, CLIENT_ERROR_MESSAGES.unexpected, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ValidationError([CLIENT_ERROR_MESSAGES.invalidJsonBody]);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => i.message));
  }
  return parsed.data;
}

/** Streams a backend binary response (e.g. a KYC document) straight through - never buffers the file in memory. */
export function streamFile(upstream: Response) {
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "attachment",
    },
  });
}
