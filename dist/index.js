import { EventEmitter } from "node:events";
import { Socket } from "node:net";
import { parseProtocol } from "./protocol.js";
import { parseDeviceInfo } from "./deviceInfo.js";
import { parseInputLabels } from "./inputLabels.js";
import { parseOutputLabels } from "./outputLabels.js";
import { parseOutputLocks } from "./outputLocks.js";
import { parseOutputRouting } from "./outputRouting.js";
import { parseConfig } from "./config.js";
const delimiter = "\n\n";
export class VideohubClient extends EventEmitter {
    host;
    port;
    socket;
    buffer;
    op;
    pendingOperation = false;
    constructor(host, port = 9990) {
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
    async connect(timeout = 2000) {
        if (this.socket) {
            this.socket.resetAndDestroy();
            this.socket.removeAllListeners();
        }
        return new Promise((resolve, reject) => {
            this.socket = new Socket();
            this.socket.setKeepAlive(true);
            this.socket.setNoDelay(true);
            this.socket.setEncoding('ascii');
            const to = setTimeout(() => {
                reject(new Error("Connection timeout"));
            }, timeout);
            this.socket.once("connect", () => {
                clearTimeout(to);
                resolve();
            });
            this.socket.once("error", err => reject(err));
            this.setupEventListeners();
            this.socket.connect(this.port, this.host);
        });
    }
    async disconnect() {
        return new Promise(resolve => {
            this.socket.removeAllListeners();
            this.socket.resetAndDestroy();
            resolve();
        });
    }
    async setRoute(route) {
        return this.write(`VIDEO OUTPUT ROUTING:\n${route.target} ${route.source}\n\n`);
    }
    async setInputLabel(input, label) {
        return this.setLabel("INPUT LABELS:", input, label);
    }
    async setOutputLabel(output, label) {
        return this.setLabel("OUTPUT LABELS:", output, label);
    }
    async setLabel(command, port, label) {
        if (!Number.isInteger(port) || port < 0)
            throw new Error("Port index must be a non-negative integer");
        if (/[\r\n]/.test(label))
            throw new Error("Labels cannot contain line breaks");
        return this.write(`${command}\n${port} ${label}\n\n`);
    }
    async write(msg) {
        if (this.pendingOperation) {
            throw new Error('Another operation is pending');
        }
        return new Promise((resolve, reject) => {
            this.pendingOperation = true;
            const to = setTimeout(() => {
                this.pendingOperation = false;
                reject("timeout");
            }, 1000);
            this.once('ack', () => {
                this.pendingOperation = false;
                clearTimeout(to);
                resolve();
            });
            this.once('nak', () => {
                this.pendingOperation = false;
                clearTimeout(to);
                reject();
            });
            this.socket.write(msg, "ascii");
        });
    }
    setupEventListeners() {
        this.socket.on("data", (data) => this.parseData(data));
        this.socket.on('close', () => {
            this.socket.removeAllListeners();
            this.socket.destroy();
            this.emit("close");
        });
        this.socket.on("error", (error) => {
            this.emit("error", error);
        });
    }
    parseData(data) {
        this.buffer += data.toString("ascii");
        const messages = this.buffer.split(delimiter);
        this.buffer = messages.pop() ?? '';
        for (const message of messages) {
            if (!message.trim())
                continue;
            const lines = message.split("\n");
            if (lines.length < 1)
                continue;
            const header = lines.shift();
            if (!header)
                continue;
            const op = this.op.get(header) ?? this.noop.bind(this);
            try {
                op(lines);
            }
            catch (err) {
                console.error(err);
            }
        }
    }
    handlePreamble(lines) {
        this.emit('preamble', parseProtocol(lines));
    }
    handleDevice(lines) {
        this.emit('deviceInfo', parseDeviceInfo(lines));
    }
    handleInputLabels(lines) {
        this.emit('inputLabels', parseInputLabels(lines));
    }
    handleOutputLabels(lines) {
        this.emit('outputLabels', parseOutputLabels(lines));
    }
    handleOutputLocks(lines) {
        this.emit('outputLocks', parseOutputLocks(lines));
    }
    handleVideoRoute(lines) {
        this.emit('routes', parseOutputRouting(lines));
    }
    handleConfiguration(lines) {
        this.emit('configuration', parseConfig(lines));
    }
    handleAck(_) {
        this.emit('ack');
    }
    handleNak(_) {
        this.emit('nak');
    }
    noop(_) {
    }
}
export default VideohubClient;
//# sourceMappingURL=index.js.map