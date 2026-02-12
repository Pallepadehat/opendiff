import path from "node:path";

export type DiffMode = "unified" | "split";

export type ParsedCli = {
  leftPath: string;
  rightPath: string;
  mode: DiffMode;
  context: number;
  commandName: string;
};

export type CliParseResult =
  | { kind: "help"; commandName: string }
  | { kind: "version"; commandName: string }
  | { kind: "run"; parsed: ParsedCli }
  | { kind: "error"; commandName: string; message: string };

const DEFAULT_MODE: DiffMode = "split";
const DEFAULT_CONTEXT = 3;

export function parseCli(argv: string[]): CliParseResult {
  const commandName = normalizeCommandName(argv[1]);
  const tokens = argv.slice(2);

  if (tokens.length === 0) {
    return {
      kind: "error",
      commandName,
      message: "Missing required arguments: <left> <right>.",
    };
  }

  let mode: DiffMode = DEFAULT_MODE;
  let context = DEFAULT_CONTEXT;
  const positional: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) {
      continue;
    }

    if (token === "--help" || token === "-h") {
      return { kind: "help", commandName };
    }
    if (token === "--version" || token === "-v") {
      return { kind: "version", commandName };
    }
    if (token === "--mode") {
      const value = tokens[index + 1];
      if (!value) {
        return {
          kind: "error",
          commandName,
          message: "Missing value for --mode. Use unified or split.",
        };
      }
      if (value !== "unified" && value !== "split") {
        return {
          kind: "error",
          commandName,
          message: `Invalid mode '${value}'. Use unified or split.`,
        };
      }
      mode = value;
      index += 1;
      continue;
    }
    if (token === "--context") {
      const value = tokens[index + 1];
      if (!value) {
        return {
          kind: "error",
          commandName,
          message: "Missing value for --context.",
        };
      }
      const numeric = Number(value);
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > 9999) {
        return {
          kind: "error",
          commandName,
          message: "Invalid --context value. Use an integer between 0 and 9999.",
        };
      }
      context = numeric;
      index += 1;
      continue;
    }

    if (token.startsWith("-")) {
      return {
        kind: "error",
        commandName,
        message: `Unknown option '${token}'.`,
      };
    }

    positional.push(token);
  }

  if (positional.length !== 2) {
    return {
      kind: "error",
      commandName,
      message: "Expected exactly two paths: <left> <right>.",
    };
  }

  const leftPath = positional[0];
  const rightPath = positional[1];
  if (!leftPath || !rightPath) {
    return {
      kind: "error",
      commandName,
      message: "Expected exactly two paths: <left> <right>.",
    };
  }

  return {
    kind: "run",
    parsed: {
      leftPath,
      rightPath,
      mode,
      context,
      commandName,
    },
  };
}

export function formatHelp(commandName: string): string {
  const cmd = commandName || "opendiff";
  return [
    `Usage: ${cmd} [options] <left> <right>`,
    "",
    "Compare two files or two directories with a visual TUI diff.",
    "",
    "Options:",
    "  -h, --help             Show help",
    "  -v, --version          Show version",
    "  --mode <unified|split> Diff layout (default: split)",
    "  --context <n>          Context lines in unified mode (default: 3)",
    "",
    "Examples:",
    `  ${cmd} old.txt new.txt`,
    `  ${cmd} --mode unified src-old src-new`,
    "",
    "Tip (macOS): if your shell resolves Apple's /usr/bin/opendiff, use 'vd' to run OpenDiff.",
  ].join("\n");
}

export function formatCliError(commandName: string, message: string): string {
  if (isMissingArgumentError(message)) {
    const cmd = commandName || "opendiff";
    return [
      "Please provide two paths to compare.",
      "",
      formatHelp(commandName),
      "",
      "Quick start:",
      `  ${cmd} left.txt right.txt`,
    ].join("\n");
  }

  return [`Error: ${message}`, "", formatHelp(commandName)].join("\n");
}

function normalizeCommandName(rawArgv1: string | undefined): string {
  if (!rawArgv1) {
    return "opendiff";
  }
  const base = path.basename(rawArgv1);
  if (base === "vd") {
    return "vd";
  }
  return "opendiff";
}

function isMissingArgumentError(message: string): boolean {
  return (
    message === "Missing required arguments: <left> <right>." ||
    message === "Expected exactly two paths: <left> <right>."
  );
}
