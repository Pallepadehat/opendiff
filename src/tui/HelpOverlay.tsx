import { Show } from "solid-js";
import { theme } from "./theme";

type HelpOverlayProps = {
  directoryMode: boolean;
};

export function HelpOverlay(props: HelpOverlayProps) {
  return (
    <box
      width="100%"
      padding={1}
      flexDirection="column"
      backgroundColor={theme.bg.panel}
      border
      borderStyle="double"
      borderColor={theme.border.focused}
    >
      <box paddingBottom={1} justifyContent="center" width="100%">
        <text fg={theme.fg.accent}>
          <strong> HELP </strong>
        </text>
      </box>

      <HelpItem key="q / Esc" desc="quit" />
      <HelpItem key="?" desc="toggle help" />
      <HelpItem key="j / k" desc="move selection" />
      <HelpItem key="tab" desc="next file" />
      <HelpItem key="shift+tab" desc="previous file" />
      <HelpItem key="left pane" desc="original file" />
      <HelpItem key="right pane" desc="modified file" />

      <Show when={props.directoryMode}>
        <HelpItem key="preview" desc="always visible side-by-side" />
      </Show>
    </box>
  );
}

function HelpItem(props: { key: string; desc: string }) {
  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={2}
      paddingRight={2}
    >
      <text fg={theme.fg.primary}>{props.key}</text>
      <text fg={theme.fg.muted}>{props.desc}</text>
    </box>
  );
}
