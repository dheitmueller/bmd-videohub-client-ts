export const parseOutputLabels = (lines) => {
    const labels = new Map;
    for (const line of lines) {
        const [key, ...raw] = line.split(" ");
        if (!key)
            continue;
        const value = raw?.join(" ").trim();
        if (!value)
            continue;
        labels.set(parseInt(key), value);
    }
    return labels;
};
//# sourceMappingURL=outputLabels.js.map