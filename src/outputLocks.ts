import {OutputLock, OutputLocks} from "./types";

export const parseOutputLocks = (lines: string[]): OutputLocks => {
  const locks = new Map<number, OutputLock>

  for (const line of lines) {
    const [key, raw] = line.split(" ", 2);

    if (!key) continue;

    const value = raw?.trim()
    if (!value) continue;

    if (Object.values(OutputLock).includes(value as OutputLock)) {
      locks.set(parseInt(key), value as OutputLock);
    }
  }

  return locks;
}