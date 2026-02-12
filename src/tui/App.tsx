import { Show, createMemo, createSignal } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import type { DiffModel } from "../diff/types";
import { DirList } from "./DirList";
import { DiffPane } from "./DiffPane";
import { HelpOverlay } from "./HelpOverlay";
import { clampIndex, nextIndex } from "./state";

type AppProps = {
  model: DiffModel;
};

export function App(props: AppProps) {
  const renderer = useRenderer();
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [showHelp, setShowHelp] = createSignal(false);

  const selectedItem = createMemo(() => {
    const items = props.model.items;
    if (items.length === 0) {
      return undefined;
    }
    const next = clampIndex(selectedIndex(), items.length);
    if (next !== selectedIndex()) {
      setSelectedIndex(next);
    }
    return items[next];
  });

  useKeyboard((key) => {
    if (key.name === "q") {
      renderer.destroy();
      return;
    }
    if (key.name === "escape") {
      renderer.destroy();
      return;
    }
    if (key.name === "?") {
      setShowHelp((current) => !current);
      return;
    }
    if (props.model.kind !== "directory" || props.model.items.length === 0) {
      return;
    }

    if (key.name === "tab") {
      setSelectedIndex((index) => nextIndex(index, props.model.items.length, key.shift));
      return;
    }

    if (key.name === "j" || key.name === "down") {
      setSelectedIndex((index) => Math.min(props.model.items.length - 1, index + 1));
    } else if (key.name === "k" || key.name === "up") {
      setSelectedIndex((index) => Math.max(0, index - 1));
    }
  });

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#0f172a">
      <Header model={props.model} />

      <Show when={props.model.kind === "file"}>
        <box flexGrow={1} padding={1}>
          <DiffPane
            item={props.model.items[0]}
            mode={props.model.mode}
            context={props.model.context}
            title="File Diff View"
          />
        </box>
      </Show>

      <Show when={props.model.kind === "directory"}>
        <box flexGrow={1} flexDirection="row" gap={1} padding={1}>
          <box width="34%">
            <DirList items={props.model.items} selectedIndex={selectedIndex()} />
          </box>
          <box flexGrow={1}>
            <DiffPane
              item={selectedItem()}
              mode={props.model.mode}
              context={props.model.context}
              title="Diff Preview"
            />
          </box>
        </box>
      </Show>

      <Footer directoryMode={props.model.kind === "directory"} />

      <Show when={showHelp()}>
        <box position="absolute" right={1} bottom={2} width="46%">
          <HelpOverlay directoryMode={props.model.kind === "directory"} />
        </box>
      </Show>
    </box>
  );
}

function Header(props: { model: DiffModel }) {
  const additions = props.model.items.reduce((sum, item) => sum + item.additions, 0);
  const deletions = props.model.items.reduce((sum, item) => sum + item.deletions, 0);
  const info =
    props.model.kind === "directory" && props.model.changedFiles === 0
      ? "No differences found across directories."
      : "Comparing left and right.";

  return (
    <box
      border
      borderStyle="single"
      backgroundColor="#111827"
      paddingLeft={1}
      paddingRight={1}
      height={3}
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="center"
    >
      <text fg="#e2e8f0">
        OpenDiff | {shortPath(props.model.leftRoot)} {" <-> "} {shortPath(props.model.rightRoot)} |{" "}
        {props.model.mode} | changed {props.model.changedFiles}/{props.model.totalFiles} | +{additions} -{deletions}
      </text>
      <text fg="#94a3b8"> {info}</text>
    </box>
  );
}

function Footer(props: { directoryMode: boolean }) {
  return (
    <box
      border
      borderStyle="single"
      backgroundColor="#111827"
      paddingLeft={1}
      paddingRight={1}
      height={2}
      justifyContent="center"
    >
      <text fg="#94a3b8">
        q quit | ? help | j/k or arrows move | tab next | shift+tab previous
        <Show when={props.directoryMode}> | always side-by-side preview</Show>
      </text>
    </box>
  );
}

function shortPath(input: string): string {
  if (input.length <= 44) {
    return input;
  }
  return `...${input.slice(input.length - 41)}`;
}
