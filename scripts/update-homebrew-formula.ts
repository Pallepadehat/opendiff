type PackageJson = {
  version?: unknown;
  repository?: unknown;
};

const ROOT = new URL("../", import.meta.url);
const PACKAGE_JSON_PATH = new URL("package.json", ROOT);
const FORMULA_PATH = new URL("Formula/opendiff.rb", ROOT);

const packageJson = (await Bun.file(PACKAGE_JSON_PATH).json()) as PackageJson;
const version = readVersion(packageJson);
const repo = readRepository(packageJson);
const checksums = await loadChecksums();

const darwinArm64Sha = checksums["opendiff-darwin-arm64"];
const darwinX64Sha = checksums["opendiff-darwin-x64"];
const linuxX64Sha = checksums["opendiff-linux-x64"];
const linuxArm64Sha = checksums["opendiff-linux-arm64"];
if (!darwinArm64Sha && !darwinX64Sha && !linuxX64Sha && !linuxArm64Sha) {
  throw new Error(
    "No release checksum files found in dist/. Build artifacts first (bun run release:artifact).",
  );
}

const formula = `class Opendiff < Formula
  desc "Clean and user-friendly visual terminal diff tool"
  homepage "https://github.com/${repo.owner}/${repo.name}"
  version "${version}"

${renderMacSection(version, repo.owner, repo.name, darwinArm64Sha, darwinX64Sha)}
${renderLinuxSection(version, repo.owner, repo.name, linuxX64Sha, linuxArm64Sha)}

  def install
    binary = Dir["opendiff-*"].first
    raise "No opendiff binary found in downloaded artifact." if binary.nil?

    bin.install binary => "opendiff"
    bin.install_symlink "opendiff" => "vd"
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/opendiff --help")
    assert_match "Usage:", shell_output("#{bin}/vd --help")
  end
end
`;

await Bun.write(FORMULA_PATH, formula);
console.log(`Updated Formula/opendiff.rb for v${version}`);

function renderMacSection(
  releaseVersion: string,
  owner: string,
  name: string,
  arm64Sha: string | undefined,
  x64Sha: string | undefined,
): string {
  if (!arm64Sha && !x64Sha) {
    return "";
  }
  const lines = [
    "  on_macos do",
    ...(arm64Sha
      ? [
          "    on_arm do",
          `      url "https://github.com/${owner}/${name}/releases/download/v${releaseVersion}/opendiff-darwin-arm64"`,
          `      sha256 "${arm64Sha}"`,
          "    end",
          "",
        ]
      : []),
    ...(x64Sha
      ? [
          "    on_intel do",
          `      url "https://github.com/${owner}/${name}/releases/download/v${releaseVersion}/opendiff-darwin-x64"`,
          `      sha256 "${x64Sha}"`,
          "    end",
          "",
        ]
      : []),
    "  end",
    "",
  ];
  return lines.join("\n");
}

function renderLinuxSection(
  releaseVersion: string,
  owner: string,
  name: string,
  x64Sha: string | undefined,
  arm64Sha: string | undefined,
): string {
  if (!x64Sha && !arm64Sha) {
    return "";
  }
  const lines = [
    "  on_linux do",
    ...(x64Sha
      ? [
          "    on_intel do",
          `      url "https://github.com/${owner}/${name}/releases/download/v${releaseVersion}/opendiff-linux-x64"`,
          `      sha256 "${x64Sha}"`,
          "    end",
          "",
        ]
      : []),
    ...(arm64Sha
      ? [
          "    on_arm do",
          `      url "https://github.com/${owner}/${name}/releases/download/v${releaseVersion}/opendiff-linux-arm64"`,
          `      sha256 "${arm64Sha}"`,
          "    end",
          "",
        ]
      : []),
    "  end",
    "",
  ];
  return lines.join("\n");
}

async function loadChecksums(): Promise<Record<string, string>> {
  const checksums: Record<string, string> = {};
  const glob = new Bun.Glob("dist/checksums*.txt");
  for await (const relativePath of glob.scan(".")) {
    const parsed = parseChecksums(await Bun.file(relativePath).text());
    Object.assign(checksums, parsed);
  }
  return checksums;
}

function readVersion(pkg: PackageJson): string {
  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new Error("package.json version is missing or invalid.");
  }
  return pkg.version;
}

function readRepository(pkg: PackageJson): { owner: string; name: string } {
  if (!pkg.repository || typeof pkg.repository !== "object") {
    throw new Error("package.json repository is missing.");
  }
  const repository = pkg.repository as { url?: unknown };
  if (typeof repository.url !== "string" || repository.url.length === 0) {
    throw new Error("package.json repository.url is missing.");
  }

  const cleanUrl = repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
  const match = cleanUrl.match(/github\.com[:/](?<owner>[^/]+)\/(?<name>[^/]+)$/);
  const owner = match?.groups?.owner;
  const name = match?.groups?.name;
  if (!owner || !name) {
    throw new Error(`Unable to parse GitHub owner/repo from repository.url: ${repository.url}`);
  }
  return { owner, name };
}

function parseChecksums(fileContents: string): Record<string, string> {
  const entries = fileContents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const checksums: Record<string, string> = {};
  for (const entry of entries) {
    const parts = entry.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }
    const hash = parts[0];
    const filename = parts[parts.length - 1];
    if (!hash || !filename) {
      continue;
    }
    checksums[filename] = hash;
  }
  return checksums;
}
