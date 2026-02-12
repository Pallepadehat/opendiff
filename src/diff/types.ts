import type { DiffMode } from "../cli";

export type InputKind = "file" | "directory";

export type DiffStatus =
  | "added"
  | "removed"
  | "modified"
  | "unchanged"
  | "type-changed";

export type DiffError = {
  message: string;
};

export type DiffItem = {
  relativePath: string;
  status: DiffStatus;
  leftPath: string | null;
  rightPath: string | null;
  leftContent: string;
  rightContent: string;
  isBinary: boolean;
  isTooLarge: boolean;
  message?: string;
  additions: number;
  deletions: number;
};

export type DiffModel = {
  kind: InputKind;
  leftRoot: string;
  rightRoot: string;
  mode: DiffMode;
  context: number;
  items: DiffItem[];
  totalFiles: number;
  changedFiles: number;
  unchangedFiles: number;
};

export type BuildModelOptions = {
  leftPath: string;
  rightPath: string;
  mode: DiffMode;
  context: number;
  maxFileBytes?: number;
};
