import type { DiffMode } from "../cli";
import type { DiffItem } from "../diff/types";
import { Show } from "solid-js";

type DiffPaneProps = {
  item: DiffItem | undefined;
  mode: DiffMode;
  context: number;
  title: string;
};

export function DiffPane(props: DiffPaneProps) {
  const item = () => props.item;

  return (
    <box
      border
      borderStyle="rounded"
      borderColor="#334155"
      title={` ${props.title} `}
      flexGrow={1}
      flexDirection="column"
      backgroundColor="#0b1220"
    >
      <Show
        when={item()}
        fallback={
          <box padding={1}>
            <text fg="#94a3b8">No files to preview. Both sides are identical.</text>
          </box>
        }
      >
        <box flexGrow={1} flexDirection="column">
          <box paddingLeft={1} paddingRight={1} border borderStyle="single">
            <text fg="#cbd5e1">
              {item()?.relativePath} | +{item()?.additions ?? 0} -{item()?.deletions ?? 0}
            </text>
          </box>

          <StatusBanner item={item()} />

          <box flexGrow={1} flexDirection="row" gap={1} padding={1}>
            <PaneColumn title="Left" content={item()?.leftContent ?? ""} />
            <PaneColumn title="Right" content={item()?.rightContent ?? ""} />
          </box>

          <Show when={item() && (item()!.isBinary || item()!.isTooLarge)}>
            <box paddingLeft={1} paddingRight={1} paddingBottom={1}>
              <text fg="#f59e0b">{item()?.message ?? "Preview unavailable for this file type."}</text>
            </box>
          </Show>
        </box>
      </Show>
    </box>
  );
}

function PaneColumn(props: { title: string; content: string }) {
  return (
    <box
      flexGrow={1}
      width="50%"
      border
      borderStyle="single"
      borderColor="#334155"
      title={` ${props.title} `}
    >
      <scrollbox focused flexGrow={1} padding={1}>
        <line_number code={props.content} showLineNumbers />
      </scrollbox>
    </box>
  );
}

function StatusBanner(props: { item: DiffItem | undefined }) {
  const item = () => props.item;
  return (
    <Show when={item()}>
      <box paddingLeft={1} paddingRight={1} paddingTop={1}>
        <text fg={statusColor(item()?.status)}>
          {statusMessage(item())}
        </text>
      </box>
    </Show>
  );
}

function statusMessage(item: DiffItem | undefined): string {
  if (!item) {
    return "No preview available.";
  }
  if (item.status === "unchanged") {
    return "No differences found. Showing both sides side-by-side.";
  }
  if (item.status === "added") {
    return "File exists only on the right side.";
  }
  if (item.status === "removed") {
    return "File exists only on the left side.";
  }
  if (item.status === "type-changed") {
    return "Path type differs between left and right.";
  }
  return "Differences found. Compare left and right panes.";
}

function statusColor(status: DiffItem["status"] | undefined): string {
  switch (status) {
    case "unchanged":
      return "#22c55e";
    case "added":
      return "#3b82f6";
    case "removed":
      return "#f97316";
    case "modified":
      return "#e2e8f0";
    case "type-changed":
      return "#f59e0b";
    default:
      return "#94a3b8";
  }
}
