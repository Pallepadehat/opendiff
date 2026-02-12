# OpenDiff

`opendiff` is a clean, keyboard-friendly terminal UI for diffing files and directories.

It ships with two commands:
- `opendiff` (primary)
- `vd` (alias to `opendiff`)

## Features

- File vs file visual diffs
- Directory vs directory comparison with changed-file list
- Unified or split diff modes
- Keyboard-first navigation and in-app help
- Binary and large-file safeguards

## Install

### Homebrew (tap)

```bash
brew tap Pallepadehat/opendiff https://github.com/Pallepadehat/opendiff
brew install Pallepadehat/opendiff/opendiff
```

Homebrew normally maps `owner/repo` taps to `owner/homebrew-repo`. The explicit tap URL above tells Homebrew to use this repository directly.

After install, both commands are available:

```bash
opendiff --help
vd --help
```

> macOS note: Apple also ships an `opendiff` command in some Xcode setups. If both are present, use `vd` to avoid command-name conflicts.

### Download from GitHub Releases

Pick the binary for your platform from the latest release:

- `opendiff-darwin-arm64`
- `opendiff-linux-x64`

Then make it executable and place it on your `PATH`:

```bash
chmod +x opendiff-<platform>-<arch>
mv opendiff-<platform>-<arch> /usr/local/bin/opendiff
ln -sf /usr/local/bin/opendiff /usr/local/bin/vd
```

### Build locally

```bash
bun install
bun run build
bun ./dist/opendiff.js --help
```

## Usage

```bash
opendiff [options] <left> <right>
vd [options] <left> <right>
```

Examples:

```bash
opendiff old.txt new.txt
opendiff --mode unified --context 5 src-v1 src-v2
vd README.old.md README.new.md
```

## CLI Options

- `-h`, `--help` Show help
- `-v`, `--version` Show version
- `--mode <unified|split>` Diff layout (default: `split`)
- `--context <n>` Context lines for unified mode (default: `3`)

## Keyboard Controls

- `q` or `Esc`: quit (or close detail view in directory mode)
- `j` / `k` or `Up` / `Down`: move selection
- `Tab` / `Shift+Tab`: next/previous changed file
- `Enter`: open selected file diff (directory mode)
- `?`: toggle help overlay

## Development

Prerequisites:

- Bun `>=1.3.0`

```bash
bun install
bun test
bun run typecheck
bun run dev -- left.txt right.txt
```

## Releasing

1. Build release binary and checksums for your current machine:
   ```bash
   bun run release:artifact
   ```
   Local builds are host-only (for example macOS arm64 on Apple Silicon).
2. Regenerate Homebrew formula checksums from available artifacts in `dist/`:
   ```bash
   bun run release:formula
   ```
3. Commit and push the updated `Formula/opendiff.rb`.
4. Create/publish a GitHub release (`v<version>`), then upload:
   - `dist/opendiff-darwin-arm64`
   - `dist/opendiff-linux-x64`
   - `dist/checksums-v<version>.txt`

### CI release automation

Publishing a GitHub release triggers `.github/workflows/release.yml`, which builds platform binaries and uploads artifacts to that release.

## Contributing

See `CONTRIBUTING.md` for local workflow. Issues and pull requests are welcome. Please include:
- a clear problem statement
- reproduction steps for bugs
- tests for behavior changes
