import path from "node:path";
import { diffLines } from "diff";
import {
  listFilesRecursive,
  readTextFile,
  resolveInputs,
  toRelativePath,
} from "./reader";
import type { BuildModelOptions, DiffItem, DiffModel, DiffStatus } from "./types";

export async function buildDiffModel(
  options: BuildModelOptions,
): Promise<DiffModel> {
  const resolved = await resolveInputs(options);

  if (resolved.kind === "file") {
    const leftName = path.basename(resolved.leftPath);
    const rightName = path.basename(resolved.rightPath);
    const label = leftName === rightName ? leftName : `${leftName} ↔ ${rightName}`;
    const item = await buildFileItem(
      label,
      resolved.leftPath,
      resolved.rightPath,
      resolved.maxFileBytes,
    );
    return {
      kind: "file",
      leftRoot: resolved.leftPath,
      rightRoot: resolved.rightPath,
      mode: options.mode,
      context: options.context,
      items: [item],
      totalFiles: 1,
      changedFiles: item.status === "unchanged" ? 0 : 1,
      unchangedFiles: item.status === "unchanged" ? 1 : 0,
    };
  }

  const [leftFiles, rightFiles] = await Promise.all([
    listFilesRecursive(resolved.leftPath),
    listFilesRecursive(resolved.rightPath),
  ]);

  const leftByRelative = new Map<string, string>();
  const rightByRelative = new Map<string, string>();

  for (const file of leftFiles) {
    leftByRelative.set(toRelativePath(resolved.leftPath, file), file);
  }
  for (const file of rightFiles) {
    rightByRelative.set(toRelativePath(resolved.rightPath, file), file);
  }

  const allRelPaths = new Set<string>([
    ...leftByRelative.keys(),
    ...rightByRelative.keys(),
  ]);
  const sortedRelPaths = [...allRelPaths].sort((a, b) => a.localeCompare(b));

  const items: DiffItem[] = [];
  let unchangedCount = 0;
  let changedCount = 0;
  let firstUnchangedPreview: DiffItem | null = null;
  for (const relativePath of sortedRelPaths) {
    const leftPath = leftByRelative.get(relativePath) ?? null;
    const rightPath = rightByRelative.get(relativePath) ?? null;

    const item = await buildFileItem(
      relativePath,
      leftPath,
      rightPath,
      resolved.maxFileBytes,
    );

    if (item.status !== "unchanged") {
      items.push(item);
      changedCount += 1;
    } else {
      unchangedCount += 1;
      if (!firstUnchangedPreview) {
        firstUnchangedPreview = item;
      }
    }
  }

  // Keep one side-by-side preview even when directories are identical.
  if (items.length === 0 && firstUnchangedPreview) {
    items.push(firstUnchangedPreview);
  }

  return {
    kind: "directory",
    leftRoot: resolved.leftPath,
    rightRoot: resolved.rightPath,
    mode: options.mode,
    context: options.context,
    items,
    totalFiles: sortedRelPaths.length,
    changedFiles: changedCount,
    unchangedFiles: unchangedCount,
  };
}

async function buildFileItem(
  relativePath: string,
  leftPath: string | null,
  rightPath: string | null,
  maxFileBytes: number,
): Promise<DiffItem> {
  if (!leftPath || !rightPath) {
    const status: DiffStatus = leftPath ? "removed" : "added";
    const existingPath = leftPath ?? rightPath;
    const read = existingPath
      ? await readTextFile(existingPath, maxFileBytes)
      : { text: "", isBinary: false, isTooLarge: false };
    const leftContent = leftPath ? read.text : "";
    const rightContent = rightPath ? read.text : "";
    const stats = countLineChanges(leftContent, rightContent);
    return {
      relativePath,
      status,
      leftPath,
      rightPath,
      leftContent,
      rightContent,
      isBinary: read.isBinary,
      isTooLarge: read.isTooLarge,
      message: read.message,
      additions: stats.additions,
      deletions: stats.deletions,
    };
  }

  const [leftRead, rightRead] = await Promise.all([
    readTextFile(leftPath, maxFileBytes),
    readTextFile(rightPath, maxFileBytes),
  ]);

  const textComparable =
    !leftRead.isBinary &&
    !rightRead.isBinary &&
    !leftRead.isTooLarge &&
    !rightRead.isTooLarge;

  const leftContent = leftRead.text;
  const rightContent = rightRead.text;
  const status: DiffStatus =
    textComparable && leftContent === rightContent ? "unchanged" : "modified";

  const stats = countLineChanges(leftContent, rightContent);
  return {
    relativePath,
    status,
    leftPath,
    rightPath,
    leftContent,
    rightContent,
    isBinary: leftRead.isBinary || rightRead.isBinary,
    isTooLarge: leftRead.isTooLarge || rightRead.isTooLarge,
    message: leftRead.message ?? rightRead.message,
    additions: stats.additions,
    deletions: stats.deletions,
  };
}

function countLineChanges(
  leftContent: string,
  rightContent: string,
): { additions: number; deletions: number } {
  const changes = diffLines(leftContent, rightContent);
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const lines = Math.max(change.count ?? 0, 0);
    if (change.added) {
      additions += lines;
    } else if (change.removed) {
      deletions += lines;
    }
  }

  return { additions, deletions };
}
