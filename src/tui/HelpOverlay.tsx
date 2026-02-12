import { Show } from "solid-js";

type HelpOverlayProps = {
  directoryMode: boolean;
};

export function HelpOverlay(props: HelpOverlayProps) {
  return (
    <box
      border
      borderStyle="rounded"
      borderColor="#475569"
      title=" Help "
      width="100%"
      padding={1}
      flexDirection="column"
      backgroundColor="#0b1220"
    >
      <text fg="#e2e8f0">q / Esc   quit</text>
      <text fg="#e2e8f0">?         toggle help</text>
      <text fg="#e2e8f0">j / k     move selection</text>
      <text fg="#e2e8f0">tab       next file</text>
      <text fg="#e2e8f0">shift+tab previous file</text>
      <Show when={props.directoryMode}>
        <text fg="#e2e8f0">preview   always visible side-by-side</text>
      </Show>
    </box>
  );
}
