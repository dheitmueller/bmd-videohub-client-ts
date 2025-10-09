import {Route} from "./types.js";

export const parseOutputRouting = (lines: string[]): Route[] => {
  const routes: Route[] = []

  for (const line of lines) {
    const [targetRaw, sourceRaw] = line.split(" ", 2);

    if (!targetRaw) continue;
    if (!sourceRaw) continue;
    const source = parseInt(sourceRaw);
    const target = parseInt(targetRaw);
    routes.push({
      source: source,
      target: target,
    })
  }

  return routes;
}