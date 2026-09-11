import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@napayment/api-client";
import type { ZodSchema } from "zod";

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ message: error.message, details: error.details }, { status: 400 });
  }
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message, errorCode: error.errorCode, details: error.details },
      { status: error.status },
    );
  }
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => i.message));
  }
  return parsed.data;
}

export class ValidationError extends Error {
  details: string[];
  constructor(details: string[]) {
    super(details[0] ?? "Invalid input");
    this.details = details;
  }
}
