export const extractToken = (authHeader?: string | null): string | null => {
  if (!authHeader) return null;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1] || null;
  }
  return null;
};

/**
 * Use this method to create a crypto key from a secret which is compatible with the secret of JWT.
 * It may also be useful for other cases therefore another algorithm may be used, Feel free to customise even more settings.
 * @param secret
 * @param algorithm
 * @returns
 */
export const createSecretKeyFromSecret = async (secret: string, algorithm:
  | AlgorithmIdentifier
  | HmacImportParams
  | RsaHashedImportParams
  | EcKeyImportParams = { name: "HMAC", hash: "SHA-256" }) => {
  const secretUint8Array = new TextEncoder().encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    secretUint8Array,
    algorithm,
    false,
    ["sign", "verify"],
  );
};
