import {OutputLabel, OutputLabels} from "./types";

export const parseOutputLabels = (lines: string[]): OutputLabels => {
  const labels = new Map<number, OutputLabel>

  for (const line of lines) {
    const [key, ...raw] = line.split(" ");

    if (!key) continue;

    const value = raw?.join(" ").trim()
    if (!value) continue;

    labels.set(parseInt(key), value);
  }

  return labels;
}