import { For, Show } from "solid-js";
import type { DiffItem } from "../diff/types";

type DirListProps = {
  items: DiffItem[];
  selectedIndex: number;
};

export function DirList(props: DirListProps) {
  return (
    <box
      border
      borderStyle="rounded"
      borderColor="#334155"
      title=" Changed Files "
      flexGrow={1}
      flexDirection="column"
      backgroundColor="#0b1220"
      padding={1}
    >
      <Show when={props.items.length > 0} fallback={<text fg="#94a3b8">No changes found.</text>}>
        <For each={props.items}>
          {(item, index) => (
            <box
              paddingLeft={1}
              paddingRight={1}
              height={1}
              backgroundColor={index() === props.selectedIndex ? "#1e293b" : undefined}
            >
              <text fg={index() === props.selectedIndex ? "#f8fafc" : "#cbd5e1"}>
                {statusBadge(item.status)} {item.relativePath}
              </text>
            </box>
          )}
        </For>
      </Show>
    </box>
  );
}

function statusBadge(status: DiffItem["status"]): string {
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
