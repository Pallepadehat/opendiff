import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { buildDiffModel } from "../src/diff/engine";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("buildDiffModel", () => {
  test("builds file diff model", async () => {
    const root = await makeTempDir();
    const left = path.join(root, "left.txt");
    const right = path.join(root, "right.txt");
    await fs.writeFile(left, "line1\nline2\n", "utf8");
    await fs.writeFile(right, "line1\nlineX\n", "utf8");

    const model = await buildDiffModel({
      leftPath: left,
      rightPath: right,
      mode: "split",
      context: 3,
    });

    expect(model.kind).toBe("file");
    expect(model.items).toHaveLength(1);
    expect(model.items[0]?.status).toBe("modified");
    expect(model.items[0]?.additions).toBeGreaterThan(0);
  });

  test("builds directory diff model with statuses", async () => {
    const leftRoot = await makeTempDir();
    const rightRoot = await makeTempDir();

    await fs.mkdir(path.join(leftRoot, "src"), { recursive: true });
    await fs.mkdir(path.join(rightRoot, "src"), { recursive: true });

    await fs.writeFile(path.join(leftRoot, "src", "same.ts"), "same\n", "utf8");
    await fs.writeFile(path.join(rightRoot, "src", "same.ts"), "same\n", "utf8");
    await fs.writeFile(path.join(leftRoot, "src", "changed.ts"), "old\n", "utf8");
    await fs.writeFile(path.join(rightRoot, "src", "changed.ts"), "new\n", "utf8");
    await fs.writeFile(path.join(leftRoot, "src", "left-only.ts"), "gone\n", "utf8");
    await fs.writeFile(path.join(rightRoot, "src", "right-only.ts"), "new\n", "utf8");

    const model = await buildDiffModel({
      leftPath: leftRoot,
      rightPath: rightRoot,
      mode: "split",
      context: 3,
    });

    expect(model.kind).toBe("directory");
    const statuses = new Map(model.items.map((item) => [item.relativePath, item.status]));
    expect(statuses.get("src/changed.ts")).toBe("modified");
    expect(statuses.get("src/left-only.ts")).toBe("removed");
    expect(statuses.get("src/right-only.ts")).toBe("added");
    expect(statuses.has("src/same.ts")).toBe(false);
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "opendiff-test-"));
  tempDirs.push(dir);
  return dir;
}
