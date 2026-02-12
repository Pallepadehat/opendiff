import { describe, expect, test } from "bun:test";
import { parseCli } from "../src/cli";

describe("parseCli", () => {
  test("parses file or dir compare command", () => {
    const result = parseCli(["bun", "opendiff", "--mode", "unified", "--context", "5", "a", "b"]);
    expect(result.kind).toBe("run");
    if (result.kind !== "run") {
      return;
    }
    expect(result.parsed.leftPath).toBe("a");
    expect(result.parsed.rightPath).toBe("b");
    expect(result.parsed.mode).toBe("unified");
    expect(result.parsed.context).toBe(5);
  });

  test("supports vd command alias detection", () => {
    const result = parseCli(["bun", "vd", "left", "right"]);
    expect(result.kind).toBe("run");
    if (result.kind !== "run") {
      return;
    }
    expect(result.parsed.commandName).toBe("vd");
  });

  test("returns help mode", () => {
    const result = parseCli(["bun", "opendiff", "--help"]);
    expect(result.kind).toBe("help");
  });

  test("returns error for invalid options", () => {
    const result = parseCli(["bun", "opendiff", "--wat", "left", "right"]);
    expect(result.kind).toBe("error");
  });
});
