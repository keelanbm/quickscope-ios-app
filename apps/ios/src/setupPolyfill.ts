import "react-native-get-random-values";
import { Buffer } from "buffer";

Buffer.prototype.subarray = function subarray(start?: number, end?: number) {
  const newBuf = Uint8Array.prototype.subarray.call(
    this,
    start,
    end
  ) as unknown as Buffer;
  Object.setPrototypeOf(newBuf, Buffer.prototype);

  return newBuf;
};

if (!("Buffer" in globalThis)) {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}
