export const parseConfig = (lines) => {
    const configuration = {
        takeMode: false,
    };
    for (const line of lines) {
        const [key, raw] = line.split(":");
        const value = raw?.trim();
        if (!key || !value)
            continue;
        if (key == "Take Mode") {
            configuration.takeMode = value == "true";
        }
    }
    return configuration;
};
//# sourceMappingURL=config.js.map