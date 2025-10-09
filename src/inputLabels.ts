import {InputLabel, InputLabels} from "./types.js";

export const parseInputLabels = (lines: string[]): InputLabels => {
  const labels = new Map<number, InputLabel>

  for (const line of lines) {
    const [key, ...raw] = line.split(" ");

    if (!key) continue;

    const value = raw?.join(" ").trim()
    if (!value) continue;

    labels.set(parseInt(key), value);
  }

  return labels;
}