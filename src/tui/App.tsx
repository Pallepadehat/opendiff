import { Show, createMemo, createSignal } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import type { DiffModel } from "../diff/types";
import { DirList } from "./DirList";
import { DiffPane } from "./DiffPane";
import { HelpOverlay } from "./HelpOverlay";
import { clampIndex, nextIndex } from "./state";
import { theme } from "./theme";
import { Span } from "./Span";

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
      setSelectedIndex((index) =>
        nextIndex(index, props.model.items.length, key.shift),
      );
      return;
    }

    if (key.name === "j" || key.name === "down") {
      setSelectedIndex((index) =>
        Math.min(props.model.items.length - 1, index + 1),
      );
    } else if (key.name === "k" || key.name === "up") {
      setSelectedIndex((index) => Math.max(0, index - 1));
    }
  });

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.bg.main}>
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
        <box
          flexGrow={1}
          flexDirection="row"
          gap={1}
          paddingLeft={1}
          paddingRight={1}
        >
          <box width="30%">
            <DirList
              items={props.model.items}
              selectedIndex={selectedIndex()}
            />
          </box>
          {/* Vertical Separator */}
          <box width={1} flexDirection="column" alignItems="center">
            <box height="100%" width={1} backgroundColor={theme.bg.selected} />
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
        <box position="absolute" right={2} bottom={3} width="40%">
          <HelpOverlay directoryMode={props.model.kind === "directory"} />
        </box>
      </Show>
    </box>
  );
}

function Header(props: { model: DiffModel }) {
  const additions = props.model.items.reduce(
    (sum, item) => item.additions + sum,
    0,
  );
  const deletions = props.model.items.reduce(
    (sum, item) => item.deletions + sum,
    0,
  );

  return (
    <box
      height={1}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={theme.bg.header}
    >
      <text fg={theme.fg.primary}>
        <strong>OpenDiff</strong> <Span fg={theme.fg.muted}>|</Span>{" "}
        {shortPath(props.model.leftRoot)} <Span fg={theme.fg.muted}>↔</Span>{" "}
        {shortPath(props.model.rightRoot)}
      </text>
      <text>
        <Span fg={theme.fg.success}>+{additions}</Span>{" "}
        <Span fg={theme.fg.muted}>/</Span>{" "}
        <Span fg={theme.fg.error}>-{deletions}</Span>
      </text>
    </box>
  );
}

function Footer(props: { directoryMode: boolean }) {
  return (
    <box
      height={1}
      justifyContent="flex-start"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={theme.bg.header}
    >
      <text fg={theme.fg.muted}>
        <Span fg={theme.fg.accent}>?</Span> help{" "}
        <Span fg={theme.fg.accent}>q</Span> quit
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
