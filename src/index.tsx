#!/usr/bin/env bun

import { render } from "@opentui/solid";
import { parseCli, formatHelp } from "./cli";
import { buildDiffModel } from "./diff/engine";
import { App } from "./tui/App";

const cliResult = parseCli(process.argv);

if (cliResult.kind === "help") {
  console.log(formatHelp(cliResult.commandName));
} else if (cliResult.kind === "version") {
  console.log(await getAppVersion());
} else if (cliResult.kind === "error") {
  console.error(`Error: ${cliResult.message}`);
  console.error("");
  console.error(formatHelp(cliResult.commandName));
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

async function getAppVersion(): Promise<string> {
  const packageJsonPath = new URL("../package.json", import.meta.url);
  const packageJson = await Bun.file(packageJsonPath).json();
  if (
    packageJson &&
    typeof packageJson === "object" &&
    "version" in packageJson &&
    typeof packageJson.version === "string"
  ) {
    return packageJson.version;
  }
  return "0.0.0";
}
