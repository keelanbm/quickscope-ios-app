import { Buffer } from "buffer";
import * as Linking from "expo-linking";
import bs58 from "bs58";
import nacl from "tweetnacl";

const PHANTOM_BASE_URL = "https://phantom.app/ul/v1/";
const DEFAULT_CLUSTER = "mainnet-beta";

export type PhantomAppConnection = {
  publicKey: string;
  session: string;
  dappKeyPair: nacl.BoxKeyPair;
  sharedSecret: Uint8Array;
};

type PendingRequest =
  | {
      type: "connect";
      resolve: (connection: PhantomAppConnection) => void;
      reject: (error: Error) => void;
      dappKeyPair: nacl.BoxKeyPair;
    }
  | {
      type: "sign";
      resolve: (signature: string) => void;
      reject: (error: Error) => void;
      sharedSecret: Uint8Array;
    };

let pendingRequest: PendingRequest | null = null;

function buildPhantomUrl(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${PHANTOM_BASE_URL}${path}?${query.toString()}`;
}

function toCallbackRoute(parsedUrl: URL) {
  const host = parsedUrl.hostname?.trim();
  if (host) {
    return host;
  }

  return parsedUrl.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
}

function decodeBase58(param: string, label: string): Uint8Array {
  try {
    return bs58.decode(param);
  } catch (error) {
    throw new Error(`Invalid ${label} in Phantom response.`);
  }
}

function decryptPayload(
  encrypted: Uint8Array,
  nonce: Uint8Array,
  sharedSecret: Uint8Array
): Uint8Array {
  const opened = nacl.box.open.after(encrypted, nonce, sharedSecret);
  if (!opened) {
    throw new Error("Unable to decrypt Phantom payload.");
  }

  return opened;
}

function decodeJsonPayload(payload: Uint8Array) {
  try {
    const json = Buffer.from(payload).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch (error) {
    throw new Error("Invalid Phantom payload format.");
  }
}

function encodePayload(payload: Record<string, unknown>): Uint8Array {
  return Buffer.from(JSON.stringify(payload), "utf8");
}

export async function connectPhantomApp(options: {
  appUrl: string;
  redirectLink: string;
  cluster?: string;
}) {
  if (pendingRequest) {
    throw new Error("Another Phantom request is already in progress.");
  }

  const dappKeyPair = nacl.box.keyPair();
  const url = buildPhantomUrl("connect", {
    app_url: options.appUrl,
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    redirect_link: options.redirectLink,
    cluster: options.cluster ?? DEFAULT_CLUSTER,
  });

  return new Promise<PhantomAppConnection>((resolve, reject) => {
    pendingRequest = {
      type: "connect",
      resolve,
      reject,
      dappKeyPair,
    };

    Linking.openURL(url).catch((error) => {
      pendingRequest = null;
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
}

export async function signMessageWithPhantomApp(
  connection: PhantomAppConnection,
  message: string,
  options: { redirectLink: string }
) {
  if (pendingRequest) {
    throw new Error("Another Phantom request is already in progress.");
  }

  const nonce = nacl.randomBytes(24);
  const messageBytes = Buffer.from(message, "utf8");
  const payload = encodePayload({
    session: connection.session,
    message: bs58.encode(messageBytes),
    display: "utf8",
  });

  const encryptedPayload = nacl.box.after(payload, nonce, connection.sharedSecret);
  const url = buildPhantomUrl("signMessage", {
    dapp_encryption_public_key: bs58.encode(connection.dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: options.redirectLink,
    payload: bs58.encode(encryptedPayload),
  });

  return new Promise<string>((resolve, reject) => {
    pendingRequest = {
      type: "sign",
      resolve,
      reject,
      sharedSecret: connection.sharedSecret,
    };

    Linking.openURL(url).catch((error) => {
      pendingRequest = null;
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
}

export function handlePhantomAppRedirect(rawUrl: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return false;
  }

  const route = toCallbackRoute(parsedUrl);
  if (route !== "phantom-connect-callback" && route !== "phantom-sign-callback") {
    return false;
  }

  const errorCode = parsedUrl.searchParams.get("errorCode");
  if (errorCode) {
    const errorMessage = parsedUrl.searchParams.get("errorMessage") ?? "Phantom request failed";
    const error = new Error(`${errorMessage} (code ${errorCode}).`);
    if (pendingRequest) {
      pendingRequest.reject(error);
      pendingRequest = null;
    }
    return true;
  }

  if (!pendingRequest) {
    return true;
  }

  try {
    const dataParam = parsedUrl.searchParams.get("data");
    const nonceParam = parsedUrl.searchParams.get("nonce");
    if (!dataParam || !nonceParam) {
      throw new Error("Missing Phantom response payload.");
    }

    if (pendingRequest.type === "connect") {
      const phantomEncryptionKey = parsedUrl.searchParams.get("phantom_encryption_public_key");
      if (!phantomEncryptionKey) {
        throw new Error("Missing Phantom encryption key.");
      }

      const data = decodeBase58(dataParam, "data");
      const nonce = decodeBase58(nonceParam, "nonce");
      const phantomKey = decodeBase58(phantomEncryptionKey, "phantom encryption key");
      const sharedSecret = nacl.box.before(phantomKey, pendingRequest.dappKeyPair.secretKey);
      const decrypted = decryptPayload(data, nonce, sharedSecret);
      const payload = decodeJsonPayload(decrypted);
      const publicKey = payload.public_key as string | undefined;
      const session = payload.session as string | undefined;

      if (!publicKey || !session) {
        throw new Error("Phantom response missing wallet data.");
      }

      pendingRequest.resolve({
        publicKey,
        session,
        dappKeyPair: pendingRequest.dappKeyPair,
        sharedSecret,
      });
    } else {
      const data = decodeBase58(dataParam, "data");
      const nonce = decodeBase58(nonceParam, "nonce");
      const decrypted = decryptPayload(data, nonce, pendingRequest.sharedSecret);
      const payload = decodeJsonPayload(decrypted);
      const signature = payload.signature as string | undefined;

      if (!signature) {
        throw new Error("Phantom response missing signature.");
      }

      pendingRequest.resolve(signature);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    pendingRequest.reject(err);
  } finally {
    pendingRequest = null;
  }

  return true;
}

export function resetPhantomAppSession() {
  pendingRequest = null;
}
