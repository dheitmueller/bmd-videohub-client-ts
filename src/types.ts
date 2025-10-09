export interface Protocol {
  version: string
}

export interface DeviceInfo {
  devicePresent: boolean,
  modelName: string,
  friendlyName: string,
  uniqueId: string,
  videoInputs: number,
  videoProcessingUnits: number,
  videoOutputs: number,
  videoMonitoringOutputs: number,
  serialPorts: number
}

export type InputLabel = string
export type InputLabels = Map<number, InputLabel>

export type OutputLabel = string
export type OutputLabels = Map<number, OutputLabel>

export enum OutputLock {
  Local  = 'O',
  Extern = 'L',
  Unlocked = 'U',
}
export type OutputLocks = Map<number, OutputLock>

export type Route = {
  source: number,
  target: number,
}

export interface Configuration {
  takeMode: boolean;
}

export interface VideohubClientEvents {
  preamble: [protocol: Protocol];
  deviceInfo: [deviceInfo: DeviceInfo];
  inputLabels: [inputLabels: InputLabels];
  outputLabels: [outputLabels: OutputLabels];
  outputLocks: [outputLocks: OutputLocks];
  routes: [routes: Route[]];
  configuration: [configuration: Configuration];
  ack: [];
  nak: [];
  close: [];
  error: [error: Error | null];
}