import { describe, expect, it } from "vitest";
import { FLAGS, NAMES } from "./currencies";

describe("currency metadata", () => {
  it("exposes a flag and a display name for the same set of currencies", () => {
    expect(Object.keys(NAMES).sort()).toEqual(Object.keys(FLAGS).sort());
  });

  it("includes the trading base currency", () => {
    expect(FLAGS.NGN).toBe("🇳🇬");
    expect(NAMES.NGN).toBe("Nigerian Naira");
  });

  it("has no empty entries", () => {
    expect(Object.values(FLAGS).every(f => f.length > 0)).toBe(true);
    expect(Object.values(NAMES).every(n => n.length > 0)).toBe(true);
  });
});
