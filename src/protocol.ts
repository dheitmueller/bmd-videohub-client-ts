import {Protocol} from "./types";

export const parseProtocol = (lines: string[]): Protocol => {
  for (const line of lines) {
    const [key, value] = line.split(":");

    if (key == "Version") {
      return {
        version: value?.trim() ?? "",
      }
    }
  }
  return {
    version: "",
  }
}