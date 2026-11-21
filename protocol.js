// BLE protocol shared with the watch firmware (see firmware/watch/protocol.h).

const BASE = '-4c2e-4d8e-9a71-2f5c1e3d7a10';
export const UUID = {
  service:   'b6f1a000' + BASE,
  time:      'b6f1a001' + BASE,
  message:   'b6f1a002' + BASE,
  vibrate:   'b6f1a003' + BASE,
  heartRate: 'b6f1a004' + BASE,
  batteryService: 0x180F,
  batteryLevel:   0x2A19,
};

export const MAX_MESSAGE_BYTES = 100;

// 6 bytes: u32 epoch seconds UTC + i16 timezone minutes, little-endian.
export function encodeTime(date = new Date(), tzMinutes = -date.getTimezoneOffset()) {
  const buf = new ArrayBuffer(6);
  const v = new DataView(buf);
  v.setUint32(0, Math.floor(date.getTime() / 1000), true);
  v.setInt16(4, tzMinutes, true);
  return new Uint8Array(buf);
}

// UTF-8, at most 100 bytes, never cutting a character in half.
export function encodeMessage(text) {
  const enc = new TextEncoder();
  const parts = [];
  let total = 0;
  for (const ch of text) {
    const b = enc.encode(ch);
    if (total + b.length > MAX_MESSAGE_BYTES) break;
    parts.push(b);
    total += b.length;
  }
  const out = new Uint8Array(total);
  let i = 0;
  for (const b of parts) { out.set(b, i); i += b.length; }
  return out;
}

// 1 = short, 2 = double, 3 = long
export function encodeVibrate(pattern) {
  if (![1, 2, 3].includes(pattern)) throw new RangeError('pattern must be 1, 2 or 3');
  return new Uint8Array([pattern]);
}

export function decodeHeartRate(view) {
  return { bpm: view.getUint8(0), spo2: view.getUint8(1), quality: view.getUint8(2) };
}
