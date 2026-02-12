import solidPlugin from "@opentui/solid/bun-plugin";

const args = new Set(Bun.argv.slice(2));
type CompileTarget = "bun-darwin-arm64" | "bun-darwin-x64" | "bun-linux-x64" | "bun-linux-arm64";
const APP_VERSION = await resolveAppVersion();

if (args.has("--release")) {
  await buildRelease();
} else {
  await buildBundle();
}

async function buildBundle() {
  const result = await Bun.build({
    entrypoints: ["./src/index.tsx"],
    target: "bun",
    outdir: "./dist",
    minify: true,
    plugins: [solidPlugin],
    define: {
      __OPENDIFF_VERSION__: JSON.stringify(APP_VERSION),
    },
  });

  if (!result.success) {
    throw new Error(formatBuildErrors(result.logs));
  }

  const jsArtifact = result.outputs.find((output) => output.path.endsWith(".js"));
  if (!jsArtifact) {
    throw new Error("Build succeeded but no JavaScript bundle was produced.");
  }
  await Bun.write("./dist/opendiff.js", jsArtifact);

  console.log("Built dist/opendiff.js");
}

async function buildRelease() {
  const targets = resolveReleaseTargets();

  for (const config of targets) {
    const result = await Bun.build({
      entrypoints: ["./src/index.tsx"],
      target: "bun",
      minify: true,
      plugins: [solidPlugin],
      define: {
        __OPENDIFF_VERSION__: JSON.stringify(APP_VERSION),
      },
      compile: {
        target: config.target,
        outfile: config.outfile,
      },
    });

    if (!result.success) {
      throw new Error(formatBuildErrors(result.logs));
    }
    console.log(`Built ${config.outfile}`);
  }
}

function resolveReleaseTargets(): Array<{
  target: CompileTarget;
  outfile: string;
}> {
  const fromEnv = process.env.OPENDIFF_RELEASE_TARGETS?.trim();
  const requested = fromEnv ? fromEnv.split(",").map((entry) => entry.trim()) : [];
  const targets: CompileTarget[] =
    requested.length > 0
      ? requested.map(assertCompileTarget)
      : [toBunCompileTarget(process.platform, process.arch)];

  return targets.map((target) => ({
    target,
    outfile: `./dist/opendiff-${target.replace("bun-", "")}`,
  }));
}

function toBunCompileTarget(
  platform: NodeJS.Platform,
  arch: string,
): CompileTarget {
  if (platform === "darwin" && arch === "arm64") {
    return "bun-darwin-arm64";
  }
  if (platform === "darwin" && arch === "x64") {
    return "bun-darwin-x64";
  }
  if (platform === "linux" && arch === "x64") {
    return "bun-linux-x64";
  }
  if (platform === "linux" && arch === "arm64") {
    return "bun-linux-arm64";
  }
  throw new Error(`Unsupported release build platform: ${platform}/${arch}`);
}

function assertCompileTarget(value: string): CompileTarget {
  if (
    value === "bun-darwin-arm64" ||
    value === "bun-darwin-x64" ||
    value === "bun-linux-x64" ||
    value === "bun-linux-arm64"
  ) {
    return value;
  }
  throw new Error(`Unsupported compile target: ${value}`);
}

function formatBuildErrors(logs: Bun.BuildOutput["logs"]): string {
  return logs.map((log) => log.message).join("\n");
}

async function resolveAppVersion(): Promise<string> {
  const packageJson = await Bun.file("./package.json").json();
  if (
    packageJson &&
    typeof packageJson === "object" &&
    "version" in packageJson &&
    typeof packageJson.version === "string"
  ) {
    return packageJson.version;
  }
  throw new Error("Unable to read version from package.json");
}
