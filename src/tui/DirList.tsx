import { For, Show } from "solid-js";
import type { DiffItem } from "../diff/types";
import { theme } from "./theme";
import { Span } from "./Span";

type DirListProps = {
  items: DiffItem[];
  selectedIndex: number;
  changedFiles: number;
};

export function DirList(props: DirListProps) {
  return (
    <box
      flexGrow={1}
      flexDirection="column"
      backgroundColor={theme.bg.main}
      border
      borderStyle="single"
      borderColor={theme.border.color}
      paddingTop={1}
      paddingLeft={1}
      paddingRight={1}
    >
      <text fg={theme.fg.muted}>
        <strong> {props.changedFiles > 0 ? "CHANGED FILES" : "FILES"} </strong>
      </text>
      <text fg={theme.fg.muted}>{props.items.length} visible</text>
      <box height={1} />
      <Show
        when={props.items.length > 0}
        fallback={<text fg={theme.fg.muted}>No changes found.</text>}
      >
        <For each={props.items}>
          {(item, index) => (
            <box
              paddingLeft={1}
              paddingRight={1}
              height={1}
              backgroundColor={
                index() === props.selectedIndex ? theme.bg.selected : undefined
              }
            >
              <text
                fg={
                  index() === props.selectedIndex
                    ? theme.fg.accent
                    : theme.fg.secondary
                }
              >
                {index() === props.selectedIndex ? "▶" : " "}{" "}
                {item.relativePath}
              </text>
            </box>
          )}
        </For>
      </Show>
    </box>
  );
}

function statusColor(status: DiffItem["status"]): string {
  switch (status) {
    case "added":
      return theme.fg.success;
    case "removed":
      return theme.fg.error;
    case "modified":
      return theme.fg.warning;
    case "type-changed":
      return theme.fg.accent;
    case "unchanged":
      return theme.fg.secondary;
    default:
      return theme.fg.muted;
  }
}
