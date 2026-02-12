import type { DiffMode } from "../cli";
import type { DiffItem } from "../diff/types";
import { For, Show } from "solid-js";
import { diffChars, diffLines } from "diff";
import { useTerminalDimensions } from "@opentui/solid";
import { theme } from "./theme";
import { Span } from "./Span";

type DiffPaneProps = {
  item: DiffItem | undefined;
  mode: DiffMode;
  context: number;
  title: string;
};

export function DiffPane(props: DiffPaneProps) {
  const dims = useTerminalDimensions();
  const item = () => props.item;
  const rows = () =>
    buildAlignedRows(item()?.leftContent ?? "", item()?.rightContent ?? "");
  const maxCharsPerSide = () =>
    Math.max(14, Math.floor((dims().width - 20) / 2));
  const compactRowWidth = () => Math.max(20, Math.floor(dims().width * 0.7));
  const countsText = () =>
    `+${item()?.additions ?? 0} -${item()?.deletions ?? 0}`;
  const pathBudget = () =>
    Math.max(10, compactRowWidth() - countsText().length - 2);
  const displayPath = () =>
    truncateMiddle(item()?.relativePath ?? "", pathBudget());

  return (
    <box
      flexGrow={1}
      flexDirection="column"
      backgroundColor={theme.bg.main}
      border
      borderStyle="single"
      borderColor={theme.border.color}
      paddingLeft={1}
      paddingRight={1}
    >
      <Show
        when={item()}
        fallback={
          <box
            padding={1}
            alignItems="center"
            justifyContent="center"
            flexGrow={1}
          >
            <text fg={theme.fg.muted}>Select a file to view differences.</text>
          </box>
        }
      >
        <box flexGrow={1} flexDirection="column">
          <box
            paddingBottom={1}
            flexDirection="row"
            justifyContent="space-between"
          >
            <text fg={theme.fg.primary}>
              <strong>{displayPath()}</strong>
            </text>
            <text>
              <Span fg={theme.fg.success}>+{item()?.additions ?? 0}</Span>{" "}
              <Span fg={theme.fg.error}>-{item()?.deletions ?? 0}</Span>
            </text>
          </box>

          <StatusBanner item={item()} />

          <box flexDirection="row" paddingBottom={1}>
            <box flexGrow={1}>
              <text fg={theme.fg.secondary}>
                <strong>ORIGINAL (LEFT)</strong>
              </text>
            </box>
            <box width={1}>
              <text fg={theme.fg.muted}>│</text>
            </box>
            <box flexGrow={1}>
              <text fg={theme.fg.secondary}>
                <strong>MODIFIED (RIGHT)</strong>
              </text>
            </box>
          </box>

          <scrollbox focused flexGrow={1}>
            <Show
              when={rows().length > 0}
              fallback={<text fg={theme.fg.muted}>[empty on both sides]</text>}
            >
              <For each={rows()}>
                {(row) => (
                  <AlignedRow row={row} maxCharsPerSide={maxCharsPerSide()} />
                )}
              </For>
            </Show>
          </scrollbox>

          <Show when={item() && (item()!.isBinary || item()!.isTooLarge)}>
            <box paddingBottom={1}>
              <text fg={theme.fg.warning}>
                {item()?.message ?? "Preview unavailable for this file type."}
              </text>
            </box>
          </Show>
        </box>
      </Show>
    </box>
  );
}

type AlignedRowData = {
  leftNumber: number | null;
  rightNumber: number | null;
  leftSegments: InlineSegment[];
  rightSegments: InlineSegment[];
  leftType: "same" | "removed" | "empty";
  rightType: "same" | "added" | "empty";
};

type InlineSegment = {
  text: string;
  kind: "same" | "added" | "removed";
};

function AlignedRow(props: { row: AlignedRowData; maxCharsPerSide: number }) {
  return (
    <box flexDirection="row">
      <box flexGrow={1} backgroundColor={sideBackground(props.row.leftType)}>
        <text fg={theme.fg.primary}>
          <Span fg={theme.fg.muted}>
            {formatLineNumber(props.row.leftNumber)}{" "}
          </Span>
          <InlineSegments
            segments={props.row.leftSegments}
            side="left"
            maxChars={props.maxCharsPerSide}
          />
        </text>
      </box>
      <box width={1}>
        <text fg={theme.fg.muted}>│</text>
      </box>
      <box flexGrow={1} backgroundColor={sideBackground(props.row.rightType)}>
        <text fg={theme.fg.primary}>
          <Span fg={theme.fg.muted}>
            {formatLineNumber(props.row.rightNumber)}{" "}
          </Span>
          <InlineSegments
            segments={props.row.rightSegments}
            side="right"
            maxChars={props.maxCharsPerSide}
          />
        </text>
      </box>
    </box>
  );
}

function InlineSegments(props: {
  segments: InlineSegment[];
  side: "left" | "right";
  maxChars: number;
}) {
  const visible = () => truncateSegments(props.segments, props.maxChars);
  if (visible().length === 0) {
    return "";
  }
  return (
    <For each={visible()}>
      {(segment) => {
        const style = inlineStyle(segment.kind, props.side);
        return (
          <Span fg={style.fg} bg={style.bg}>
            {segment.text}
          </Span>
        );
      }}
    </For>
  );
}

function StatusBanner(props: { item: DiffItem | undefined }) {
  const item = () => props.item;
  const dims = useTerminalDimensions();
  const maxWidth = () => Math.max(20, Math.floor(dims().width * 0.7));
  return (
    <Show when={item()}>
      <box paddingRight={1} paddingBottom={1}>
        <text fg={statusColor(item()?.status)}>
          {truncateWithEllipsis(statusMessage(item()), maxWidth())}
        </text>
      </box>
    </Show>
  );
}

function statusMessage(item: DiffItem | undefined): string {
  if (!item) {
    return "";
  }
  if (item.status === "unchanged") {
    return "No differences found. Both sides are identical.";
  }
  if (item.status === "added") {
    return "Added in modified file (right).";
  }
  if (item.status === "removed") {
    return "Removed from original file (left).";
  }
  if (item.status === "type-changed") {
    return "Type changed between original and modified.";
  }
  return "Differences found from original to modified.";
}

function statusColor(status: DiffItem["status"] | undefined): string {
  switch (status) {
    case "unchanged":
      return theme.fg.success;
    case "added":
      return theme.fg.accent;
    case "removed":
      return theme.fg.error;
    case "modified":
      return theme.fg.primary;
    case "type-changed":
      return theme.fg.warning;
    default:
      return theme.fg.muted;
  }
}

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return [];
  }
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function buildAlignedRows(
  leftContent: string,
  rightContent: string,
): AlignedRowData[] {
  const changes = diffLines(leftContent, rightContent);
  const rows: AlignedRowData[] = [];

  let leftLine = 1;
  let rightLine = 1;

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index];
    if (!change) {
      continue;
    }
    const next = changes[index + 1];

    if (change.removed && next?.added) {
      const removedLines = splitLines(change.value);
      const addedLines = splitLines(next.value);
      const length = Math.max(removedLines.length, addedLines.length);

      for (let lineIndex = 0; lineIndex < length; lineIndex += 1) {
        const removed = removedLines[lineIndex];
        const added = addedLines[lineIndex];
        rows.push({
          leftNumber: removed === undefined ? null : leftLine++,
          rightNumber: added === undefined ? null : rightLine++,
          leftSegments:
            removed === undefined
              ? []
              : leftInlineSegments(removed, added ?? ""),
          rightSegments:
            added === undefined
              ? []
              : rightInlineSegments(removed ?? "", added),
          leftType: removed === undefined ? "empty" : "removed",
          rightType: added === undefined ? "empty" : "added",
        });
      }

      index += 1;
      continue;
    }

    if (change.removed) {
      for (const line of splitLines(change.value)) {
        rows.push({
          leftNumber: leftLine++,
          rightNumber: null,
          leftSegments: [{ text: line, kind: "removed" }],
          rightSegments: [],
          leftType: "removed",
          rightType: "empty",
        });
      }
      continue;
    }

    if (change.added) {
      for (const line of splitLines(change.value)) {
        rows.push({
          leftNumber: null,
          rightNumber: rightLine++,
          leftSegments: [],
          rightSegments: [{ text: line, kind: "added" }],
          leftType: "empty",
          rightType: "added",
        });
      }
      continue;
    }

    for (const line of splitLines(change.value)) {
      rows.push({
        leftNumber: leftLine++,
        rightNumber: rightLine++,
        leftSegments: [{ text: line, kind: "same" }],
        rightSegments: [{ text: line, kind: "same" }],
        leftType: "same",
        rightType: "same",
      });
    }
  }

  return rows;
}

function sideBackground(
  type: "same" | "removed" | "added" | "empty",
): string | undefined {
  if (type === "removed") {
    return theme.bg.lineRemoved;
  }
  if (type === "added") {
    return theme.bg.lineAdded;
  }
  return undefined;
}

function formatLineNumber(value: number | null): string {
  if (value === null) {
    return "    ";
  }
  return String(value).padStart(4, " ");
}

function leftInlineSegments(
  leftLine: string,
  rightLine: string,
): InlineSegment[] {
  const changes = diffChars(leftLine, rightLine);
  return changes
    .filter((change) => !change.added)
    .map((change) => ({
      text: change.value,
      kind: change.removed ? "removed" : "same",
    }));
}

function rightInlineSegments(
  leftLine: string,
  rightLine: string,
): InlineSegment[] {
  const changes = diffChars(leftLine, rightLine);
  return changes
    .filter((change) => !change.removed)
    .map((change) => ({
      text: change.value,
      kind: change.added ? "added" : "same",
    }));
}

function inlineStyle(
  kind: InlineSegment["kind"],
  side: "left" | "right",
): { fg: string | undefined; bg: string | undefined } {
  if (kind === "removed" && side === "left") {
    return { fg: theme.fg.primary, bg: theme.bg.charRemoved };
  }
  if (kind === "added" && side === "right") {
    return { fg: theme.fg.primary, bg: theme.bg.charAdded };
  }
  return { fg: undefined, bg: undefined };
}

function truncateSegments(
  input: InlineSegment[],
  maxChars: number,
): InlineSegment[] {
  if (maxChars <= 0) {
    return [];
  }
  const result: InlineSegment[] = [];
  let used = 0;

  for (const segment of input) {
    if (used >= maxChars) {
      break;
    }
    const remaining = maxChars - used;
    if (segment.text.length <= remaining) {
      result.push(segment);
      used += segment.text.length;
      continue;
    }
    const clipped = segment.text.slice(0, Math.max(0, remaining - 1)) + "…";
    result.push({ text: clipped, kind: segment.kind });
    used = maxChars;
    break;
  }

  return result;
}

function truncateWithEllipsis(input: string, maxLength: number): string {
  if (maxLength <= 0) {
    return "";
  }
  if (input.length <= maxLength) {
    return input;
  }
  if (maxLength === 1) {
    return "…";
  }
  return `${input.slice(0, maxLength - 1)}…`;
}

function truncateMiddle(input: string, maxLength: number): string {
  if (maxLength <= 0) {
    return "";
  }
  if (input.length <= maxLength) {
    return input;
  }
  if (maxLength <= 3) {
    return truncateWithEllipsis(input, maxLength);
  }
  const left = Math.ceil((maxLength - 1) / 2);
  const right = Math.floor((maxLength - 1) / 2);
  return `${input.slice(0, left)}…${input.slice(input.length - right)}`;
}
