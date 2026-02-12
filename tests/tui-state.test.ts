import { describe, expect, test } from "bun:test";
import { clampIndex, nextIndex } from "../src/tui/state";

describe("tui state helpers", () => {
  test("clampIndex keeps selection within bounds", () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(0, 5)).toBe(0);
    expect(clampIndex(10, 5)).toBe(4);
    expect(clampIndex(4, 5)).toBe(4);
  });

  test("nextIndex handles tab and shift+tab navigation", () => {
    expect(nextIndex(0, 4, false)).toBe(1);
    expect(nextIndex(3, 4, false)).toBe(3);
    expect(nextIndex(0, 4, true)).toBe(0);
    expect(nextIndex(2, 4, true)).toBe(1);
  });
});
