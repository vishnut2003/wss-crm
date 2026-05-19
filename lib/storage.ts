// Server-only Firebase Storage helpers.
// Import from Server Components, Server Actions, or route handlers — never
// from client components (firebase-admin requires the Node.js runtime).

import { getStorageBucket } from "@/config/firebase";

export type UploadOptions = {
  /** MIME type — e.g. "image/png", "application/pdf". */
  contentType?: string;
  /** Arbitrary custom metadata stored alongside the object. */
  metadata?: Record<string, string>;
  /** When true, the uploaded object is made publicly readable. */
  makePublic?: boolean;
};

/**
 * Upload a file to the configured Firebase Storage bucket.
 * @param data Buffer, Uint8Array, or any BufferSource of the file contents.
 * @param destination Bucket-relative path, e.g. "leads/abc/avatar.png".
 * @returns The bucket-relative path of the stored object.
 */
export async function uploadFile(
  data: Buffer | Uint8Array,
  destination: string,
  options: UploadOptions = {},
): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(destination);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await file.save(buffer, {
    contentType: options.contentType,
    metadata: options.metadata ? { metadata: options.metadata } : undefined,
    resumable: false,
  });
  if (options.makePublic) {
    await file.makePublic();
  }
  return destination;
}

/**
 * Delete an object from the bucket. Throws if it doesn't exist — call
 * `fileExists` first if you want a soft-delete behaviour.
 */
export async function deleteFile(destination: string): Promise<void> {
  const bucket = getStorageBucket();
  await bucket.file(destination).delete();
}

/**
 * Check whether an object exists in the bucket.
 */
export async function fileExists(destination: string): Promise<boolean> {
  const bucket = getStorageBucket();
  const [exists] = await bucket.file(destination).exists();
  return exists;
}

/**
 * Generate a time-limited signed URL for reading the object. Works even on
 * private buckets — useful for one-off downloads / previews.
 * @param expiresInSeconds Defaults to 1 hour.
 */
export async function getSignedDownloadUrl(
  destination: string,
  expiresInSeconds = 60 * 60,
): Promise<string> {
  const bucket = getStorageBucket();
  const [url] = await bucket.file(destination).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}

/**
 * Canonical public URL for an object. Only resolves if the object (or the
 * bucket) is configured for public read access.
 */
export function getPublicUrl(destination: string): string {
  const bucket = getStorageBucket();
  const encoded = encodeURIComponent(destination).replace(/%2F/g, "/");
  return `https://storage.googleapis.com/${bucket.name}/${encoded}`;
}
