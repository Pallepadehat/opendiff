#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p dist

VERSION="$(bun -e "const pkg = JSON.parse(await Bun.file('./package.json').text()); console.log(pkg.version)")"

echo "Building release binaries..."
bun run build:release

cd dist
FILES=(opendiff-*)
shasum -a 256 "${FILES[@]}" > "checksums-v${VERSION}.txt"
cd "$ROOT_DIR"

echo "Done."
echo "Release files:"
for file in dist/opendiff-*; do
  echo "  ${file}"
done
echo "  dist/checksums-v${VERSION}.txt"
