import "@testing-library/jest-dom";

// Stub BroadcastChannel (not in jsdom)
class BroadcastChannelStub {
  name: string;
  constructor(name: string) { this.name = name; }
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
}
global.BroadcastChannel = BroadcastChannelStub as unknown as typeof BroadcastChannel;

// Stub navigator.clipboard (configurable so user-event can also access it)
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

// Stub crypto.randomUUID
Object.defineProperty(global.crypto, "randomUUID", {
  value: () => "test-uuid-" + Math.random().toString(36).slice(2),
  writable: true,
});
