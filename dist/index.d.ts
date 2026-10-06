import { EventEmitter } from "node:events";
import { Route, VideohubClientEvents } from "./types.js";
export declare class VideohubClient extends EventEmitter<VideohubClientEvents> {
    private readonly host;
    private readonly port;
    private socket;
    private buffer;
    private op;
    private pendingOperation;
    constructor(host: string, port?: number);
    connect(timeout?: number): Promise<void>;
    disconnect(): Promise<void>;
    setRoute(route: Route): Promise<void>;
    setInputLabel(input: number, label: string): Promise<void>;
    setOutputLabel(output: number, label: string): Promise<void>;
    private setLabel;
    private write;
    private setupEventListeners;
    private parseData;
    private handlePreamble;
    private handleDevice;
    private handleInputLabels;
    private handleOutputLabels;
    private handleOutputLocks;
    private handleVideoRoute;
    private handleConfiguration;
    private handleAck;
    private handleNak;
    private noop;
}
export default VideohubClient;
//# sourceMappingURL=index.d.ts.map