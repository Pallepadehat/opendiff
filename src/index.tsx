#!/usr/bin/env bun

import { render } from "@opentui/solid";
import { parseCli, formatHelp, formatCliError } from "./cli";
import { buildDiffModel } from "./diff/engine";
import { App } from "./tui/App";

declare const __OPENDIFF_VERSION__: string;

const cliResult = parseCli(process.argv);

if (cliResult.kind === "help") {
  console.log(formatHelp(cliResult.commandName));
} else if (cliResult.kind === "version") {
  console.log(__OPENDIFF_VERSION__);
} else if (cliResult.kind === "error") {
  console.error(formatCliError(cliResult.commandName, cliResult.message));
  process.exitCode = 1;
} else {
  try {
    const model = await buildDiffModel({
      leftPath: cliResult.parsed.leftPath,
      rightPath: cliResult.parsed.rightPath,
      mode: cliResult.parsed.mode,
      context: cliResult.parsed.context,
    });

    render(() => <App model={model} />, {
      exitOnCtrlC: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while loading inputs.";
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}
