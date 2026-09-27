import { PROCESSOR_LOGO } from "@napayment/api-client";
import { VALIDATION_MESSAGES } from "@napayment/schemas";

const MAX_BYTES = PROCESSOR_LOGO.maxKb * 1024;

/** Approximate decoded size of a base64 data URL. */
function decodedBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

/**
 * Turns an uploaded image into the stored logo format: downscaled to fit
 * PROCESSOR_LOGO.maxDimensionPx and encoded as a base64 data URL (WebP, or
 * PNG where the browser can't encode WebP). Throws with a user-facing
 * message when the file isn't a supported image or is still too large.
 */
export async function processLogoFile(file: File): Promise<string> {
  if (!(PROCESSOR_LOGO.mimeTypes as readonly string[]).includes(file.type)) {
    throw new Error(VALIDATION_MESSAGES.logoTypeInvalid);
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(VALIDATION_MESSAGES.logoTypeInvalid);
  });
  const scale = Math.min(1, PROCESSOR_LOGO.maxDimensionPx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = canvas.toDataURL("image/webp", 0.9);
  // Browsers that can't encode WebP silently return PNG - either is accepted.
  const dataUrl = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
  if (decodedBytes(dataUrl) > MAX_BYTES) {
    throw new Error(VALIDATION_MESSAGES.logoTooLarge(PROCESSOR_LOGO.maxKb));
  }
  return dataUrl;
}
