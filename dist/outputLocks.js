import { OutputLock } from "./types.js";
export const parseOutputLocks = (lines) => {
    const locks = new Map;
    for (const line of lines) {
        const [key, raw] = line.split(" ", 2);
        if (!key)
            continue;
        const value = raw?.trim();
        if (!value)
            continue;
        if (Object.values(OutputLock).includes(value)) {
            locks.set(parseInt(key), value);
        }
    }
    return locks;
};
//# sourceMappingURL=outputLocks.js.map