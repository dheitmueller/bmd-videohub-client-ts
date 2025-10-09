import {EventEmitter} from "node:events";
import {Socket} from "node:net";
import {parseProtocol} from "./protocol.js";
import {parseDeviceInfo} from "./deviceInfo.js";
import {parseInputLabels} from "./inputLabels.js";
import {parseOutputLabels} from "./outputLabels.js";
import {parseOutputLocks} from "./outputLocks.js";
import {parseOutputRouting} from "./outputRouting.js";
import {parseConfig} from "./config.js";
import {Route, VideohubClientEvents} from "./types.js";

const delimiter: string = "\n\n";

export class VideohubClient extends EventEmitter<VideohubClientEvents> {
  private readonly host: string;
  private readonly port: number;
  private socket!: Socket;
  private buffer: string;
  private op: Map<string, (lines: string[]) => void>
  private pendingOperation: boolean = false;

  constructor(host: string, port: number = 9990) {
    super();
    this.host = host;
    this.port = port;
    this.buffer = "";
    this.op = new Map([
      ['PROTOCOL PREAMBLE:', this.handlePreamble.bind(this)],
      ['VIDEOHUB DEVICE:', this.handleDevice.bind(this)],
      ['INPUT LABELS:', this.handleInputLabels.bind(this)],
      ['OUTPUT LABELS:', this.handleOutputLabels.bind(this)],
      ['VIDEO OUTPUT LOCKS:', this.handleOutputLocks.bind(this)],
      ['VIDEO OUTPUT ROUTING:', this.handleVideoRoute.bind(this)],
      ['CONFIGURATION:', this.handleConfiguration.bind(this)],
      ['END PRELUDE:', this.noop.bind(this)],
      ['ACK', this.handleAck.bind(this)],
      ['NAK', this.handleNak.bind(this)]
    ]);
  }

  async connect(timeout: number = 2000): Promise<void> {
    if (this.socket) {
      this.socket.resetAndDestroy();
      this.socket.removeAllListeners();
    }

    return new Promise<void>((resolve, reject) => {
      this.socket = new Socket();
      this.socket.setKeepAlive(true);
      this.socket.setNoDelay(true);
      this.socket.setEncoding('ascii')

      const to = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, timeout)

      this.socket.once("connect", () => {
        clearTimeout(to);
        resolve()
      });

      this.socket.once("error", err => reject(err));

      this.setupEventListeners();

      this.socket.connect(this.port, this.host);
    })
  }

  async disconnect(): Promise<void> {
    return new Promise(resolve => {
      this.socket.removeAllListeners();
      this.socket.resetAndDestroy();
      resolve();
    })
  }

  async setRoute(route: Route): Promise<void> {
    return this.write(`VIDEO OUTPUT ROUTING:\n${route.target} ${route.source}\n\n`)
  }

  private async write(msg: string): Promise<void> {
    if (this.pendingOperation) {
      throw new Error('Another operation is pending');
    }

    return new Promise((resolve, reject) => {
      this.pendingOperation = true;

      const to = setTimeout(() => {
        this.pendingOperation = false;
        reject("timeout");
      }, 1000)

      this.once('ack', () => {
        this.pendingOperation = false;
        clearTimeout(to);
        resolve();
      })

      this.once('nak', () => {
        this.pendingOperation = false;
        clearTimeout(to);
        reject();
      })

      this.socket.write(msg, "ascii");
    })
  }

  private setupEventListeners(): void {
    this.socket.on("data", (data: Buffer) => this.parseData(data))
    this.socket.on('close', () => {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.emit("close")
    })
    this.socket.on("error", (error: Error | null) => {
      this.emit("error", error);
    })
  }

  private parseData(data: Buffer) {
    this.buffer += data.toString("ascii")
    const messages = this.buffer.split(delimiter);
    this.buffer = messages.pop() ?? '';

    for (const message of messages) {
      if (!message.trim()) continue;

      const lines = message.split("\n");
      if (lines.length < 1) continue;

      const header = lines.shift();
      if (!header) continue;

      const op = this.op.get(header) ?? this.noop.bind(this)
      try {
        op(lines)
      } catch (err) {
        console.error(err);
      }
    }
  }

  private handlePreamble(lines: string[]): void {
    this.emit('preamble', parseProtocol(lines));
  }

  private handleDevice(lines: string[]): void {
    this.emit('deviceInfo', parseDeviceInfo(lines));
  }

  private handleInputLabels(lines: string[]): void {
    this.emit('inputLabels', parseInputLabels(lines));
  }

  private handleOutputLabels(lines: string[]): void {
    this.emit('outputLabels', parseOutputLabels(lines));
  }

  private handleOutputLocks(lines: string[]): void {
    this.emit('outputLocks', parseOutputLocks(lines));
  }

  private handleVideoRoute(lines: string[]): void {
    this.emit('routes', parseOutputRouting(lines));
  }

  private handleConfiguration(lines: string[]): void {
    this.emit('configuration', parseConfig(lines));
  }

  private handleAck(_: string[]): void {
    this.emit('ack')
  }

  private handleNak(_: string[]): void {
    this.emit('nak')
  }

  private noop(_: string[]): void {
  }
}

export default VideohubClient;