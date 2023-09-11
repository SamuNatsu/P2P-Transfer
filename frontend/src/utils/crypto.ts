/// Crypto utils
import { Base64 } from 'js-base64';

/* Subtle crypto */
const crypto: SubtleCrypto = window.crypto.subtle;

/* Generate key */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/* Export key */
export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey: ArrayBuffer = await crypto.exportKey('raw', key);
  return Base64.fromUint8Array(new Uint8Array(rawKey));
}

/* Import key */
export async function importKey(b64RawKey: string): Promise<CryptoKey> {
  return await crypto.importKey(
    'raw',
    Base64.toUint8Array(b64RawKey),
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

/* Encrypt data */
export async function encryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const iv: Uint8Array = new Uint8Array(16);
  window.crypto.getRandomValues(iv);

  const cipherData: ArrayBuffer = await crypto.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
  const wrapper: Uint8Array = new Uint8Array(cipherData.byteLength + 16);
  wrapper.set(iv, 0);
  wrapper.set(new Uint8Array(cipherData), 16);

  return wrapper.buffer;
}

/* Decrypt data */
export async function decryptData(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  return await crypto.decrypt(
    {
      name: 'AES-GCM',
      iv: new DataView(data, 0, 16)
    },
    key,
    new DataView(data, 16)
  );
}
