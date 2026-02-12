import fs from "node:fs/promises";
import path from "node:path";
import type { Stats } from "node:fs";
import type { BuildModelOptions, InputKind } from "./types";

const DEFAULT_MAX_FILE_BYTES = 1_000_000;

export type ResolvedInputs = {
  leftPath: string;
  rightPath: string;
  kind: InputKind;
  maxFileBytes: number;
};

export type ReadTextResult = {
  text: string;
  isBinary: boolean;
  isTooLarge: boolean;
  message?: string;
};

export async function resolveInputs(
  options: BuildModelOptions,
): Promise<ResolvedInputs> {
  const leftPath = path.resolve(options.leftPath);
  const rightPath = path.resolve(options.rightPath);

  const [leftStat, rightStat] = await Promise.all([
    safeStat(leftPath),
    safeStat(rightPath),
  ]);

  if (!leftStat) {
    throw new Error(`Left path does not exist: ${leftPath}`);
  }
  if (!rightStat) {
    throw new Error(`Right path does not exist: ${rightPath}`);
  }

  const leftKind = detectKind(leftStat, leftPath);
  const rightKind = detectKind(rightStat, rightPath);

  if (leftKind !== rightKind) {
    throw new Error("Input types must match (file vs file or directory vs directory).");
  }

  return {
    leftPath,
    rightPath,
    kind: leftKind,
    maxFileBytes: options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
  };
}

export async function listFilesRecursive(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(absolute);
        continue;
      }
      if (entry.isFile()) {
        files.push(absolute);
      }
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

export function toRelativePath(rootDir: string, absolutePath: string): string {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

export async function readTextFile(
  filePath: string,
  maxFileBytes: number,
): Promise<ReadTextResult> {
  const buffer = await fs.readFile(filePath);

  if (buffer.length > maxFileBytes) {
    return {
      text: "",
      isBinary: false,
      isTooLarge: true,
      message: `File exceeds size limit (${buffer.length} bytes).`,
    };
  }

  if (looksBinary(buffer)) {
    return {
      text: "",
      isBinary: true,
      isTooLarge: false,
      message: "Binary file cannot be rendered in visual diff.",
    };
  }

  return {
    text: buffer.toString("utf8"),
    isBinary: false,
    isTooLarge: false,
  };
}

async function safeStat(targetPath: string): Promise<Stats | null> {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

function detectKind(stat: Stats, inputPath: string): InputKind {
  if (stat.isDirectory()) {
    return "directory";
  }
  if (stat.isFile()) {
    return "file";
  }
  throw new Error(`Unsupported input type: ${inputPath}`);
}

function looksBinary(buffer: Buffer): boolean {
  const sampleLength = Math.min(buffer.length, 8000);
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      return true;
    }
  }
  return false;
}
