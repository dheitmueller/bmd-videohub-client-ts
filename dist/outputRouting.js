export const parseOutputRouting = (lines) => {
    const routes = [];
    for (const line of lines) {
        const [targetRaw, sourceRaw] = line.split(" ", 2);
        if (!targetRaw)
            continue;
        if (!sourceRaw)
            continue;
        const source = parseInt(sourceRaw);
        const target = parseInt(targetRaw);
        routes.push({
            source: source,
            target: target,
        });
    }
    return routes;
};
//# sourceMappingURL=outputRouting.js.map