import type { DiffMode } from "../cli";
import type { DiffItem } from "../diff/types";
import { Show } from "solid-js";
import { theme } from "./theme";
import { Span } from "./Span";

type DiffPaneProps = {
  item: DiffItem | undefined;
  mode: DiffMode;
  context: number;
  title: string;
};

export function DiffPane(props: DiffPaneProps) {
  const item = () => props.item;

  return (
    <box flexGrow={1} flexDirection="column" backgroundColor={theme.bg.main}>
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
            paddingLeft={1}
            paddingRight={1}
            paddingTop={1}
            flexDirection="row"
            justifyContent="space-between"
          >
            <text fg={theme.fg.primary}>
              <strong>{item()?.relativePath}</strong>
            </text>
            <text>
              <Span fg={theme.fg.success}>+{item()?.additions ?? 0}</Span>{" "}
              <Span fg={theme.fg.error}>-{item()?.deletions ?? 0}</Span>
            </text>
          </box>

          <StatusBanner item={item()} />

          <box flexGrow={1} flexDirection="row" gap={1} padding={1}>
            <PaneColumn title="Left" content={item()?.leftContent ?? ""} />
            {/* Split separator */}
            <box width={1} flexDirection="column" alignItems="center">
              <box
                height="100%"
                width={1}
                backgroundColor={theme.border.color}
              />
            </box>
            <PaneColumn title="Right" content={item()?.rightContent ?? ""} />
          </box>

          <Show when={item() && (item()!.isBinary || item()!.isTooLarge)}>
            <box paddingLeft={1} paddingRight={1} paddingBottom={1}>
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

function PaneColumn(props: { title: string; content: string }) {
  return (
    <box flexGrow={1} width="50%" flexDirection="column">
      <box paddingBottom={1}>
        <text fg={theme.fg.secondary}>{props.title}</text>
      </box>
      <scrollbox focused flexGrow={1}>
        <line_number code={props.content} showLineNumbers />
      </scrollbox>
    </box>
  );
}

function StatusBanner(props: { item: DiffItem | undefined }) {
  const item = () => props.item;
  return (
    <Show when={item() && item()?.status !== "modified"}>
      <box paddingLeft={1} paddingRight={1} paddingTop={1}>
        <text fg={statusColor(item()?.status)}>{statusMessage(item())}</text>
      </box>
    </Show>
  );
}

function statusMessage(item: DiffItem | undefined): string {
  if (!item) {
    return "";
  }
  if (item.status === "unchanged") {
    return "No differences found.";
  }
  if (item.status === "added") {
    return "File only on right.";
  }
  if (item.status === "removed") {
    return "File only on left.";
  }
  if (item.status === "type-changed") {
    return "File type changed.";
  }
  return "";
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
