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
brew tap <owner>/tap
brew install opendiff
```

After install, both commands are available:

```bash
opendiff --help
vd --help
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

```bash
bun install
bun test
bun run typecheck
bun run dev -- left.txt right.txt
```

## Releasing

1. Build release binaries and checksums:
   ```bash
   bun run release:artifact
   ```
2. Create a GitHub release and upload:
   - `dist/opendiff-darwin-arm64`
   - `dist/opendiff-linux-x64`
   - `dist/checksums-v<version>.txt`
3. Update `Formula/opendiff.rb` in your tap repo with release URLs and SHA256 values.

## Contributing

Issues and pull requests are welcome. Please include:
- a clear problem statement
- reproduction steps for bugs
- tests for behavior changes
