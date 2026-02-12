import { For, Show } from "solid-js";
import type { DiffItem } from "../diff/types";
import { theme } from "./theme";

type DirListProps = {
  items: DiffItem[];
  selectedIndex: number;
};

export function DirList(props: DirListProps) {
  return (
    <box
      flexGrow={1}
      flexDirection="column"
      backgroundColor={theme.bg.main}
      paddingTop={1}
    >
      <text fg={theme.fg.muted}>
        <strong> CHANGED FILES </strong>
      </text>
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
                {index() === props.selectedIndex ? "│" : " "}{" "}
                {statusSymbol(item.status)} {item.relativePath}
              </text>
            </box>
          )}
        </For>
      </Show>
    </box>
  );
}

function statusSymbol(status: DiffItem["status"]): string {
  switch (status) {
    case "added":
      return "+";
    case "removed":
      return "-";
    case "modified":
      return "~";
    case "type-changed":
      return "!";
    case "unchanged":
      return "=";
    default:
      return "?";
  }
}
