import {DeviceInfo} from "./types.js";

export const parseDeviceInfo = (lines: string[]): DeviceInfo => {
  const deviceInfo: DeviceInfo = {
    devicePresent: false,
    modelName: "",
    friendlyName: "",
    uniqueId: "",
    videoInputs: 0,
    videoProcessingUnits: 0,
    videoOutputs: 0,
    videoMonitoringOutputs: 0,
    serialPorts: 0
  }

  for (const line of lines) {
    const [key, raw] = line.split(":");
    const value = raw?.trim() ?? "";
    switch (key) {
      case "Device present":
          deviceInfo.devicePresent = value == "true"
          break;
      case "Model name":
        deviceInfo.modelName = value;
        break;
        case "Friendly name":
          deviceInfo.friendlyName = value;
          break;
      case "Unique ID":
        deviceInfo.uniqueId = value;
        break;
      case "Video inputs":
        deviceInfo.videoInputs = parseInt(value);
        break;
      case "Video processing units":
        deviceInfo.videoProcessingUnits = parseInt(value);
        break;
      case "Video outputs":
        deviceInfo.videoOutputs = parseInt(value);
        break;
      case "Video monitoring outputs":
        deviceInfo.videoMonitoringOutputs = parseInt(value);
        break;
      case "Serial ports":
          deviceInfo.serialPorts = parseInt(value);
          break;
    }
  }
  return deviceInfo;
}