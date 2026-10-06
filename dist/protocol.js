export const parseProtocol = (lines) => {
    for (const line of lines) {
        const [key, value] = line.split(":");
        if (key == "Version") {
            return {
                version: value?.trim() ?? "",
            };
        }
    }
    return {
        version: "",
    };
};
//# sourceMappingURL=protocol.js.map