export function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}

export function nextIndex(index: number, length: number, shift: boolean): number {
  if (length <= 0) {
    return 0;
  }
  if (shift) {
    return Math.max(0, index - 1);
  }
  return Math.min(length - 1, index + 1);
}
