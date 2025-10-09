# BlackMagic Design VideoHub Client

A TypeScript client library for controlling BlackMagic Design VideoHub devices over TCP. Provides an event-driven interface for monitoring and controlling video routing in professional broadcast environments.

## Features

- 🔌 TCP connection management with automatic keepalive
- 📡 Event-driven architecture using Node.js EventEmitter
- 🎯 Type-safe TypeScript API with full IntelliSense support
- 🔄 Real-time monitoring of routing changes and device state
- 🔒 Output lock state management
- ⚡ Operation queuing to prevent command conflicts
- 🧪 Comprehensive test coverage

## Installation

```bash
npm install bmd-videohub-client
```

## Quick Start

```typescript
import { VideohubClient } from 'bmd-videohub-client';

const client = new VideohubClient();

// Connect to VideoHub device
await client.connect('192.168.1.100', 9990);

// Listen for routing changes
client.on('outputRouting', (routes) => {
  console.log('Current routing:', routes);
});

// Change routing: connect input 2 to output 5
await client.setRoute(2, 5);

// Disconnect
client.disconnect();
```

## API Reference

### VideohubClient

The main client class that extends Node.js `EventEmitter`.

#### Methods

##### `connect(host: string, port?: number, timeout?: number): Promise<void>`

Connects to a VideoHub device.

- `host` - IP address or hostname of the VideoHub device
- `port` - TCP port (default: 9990)
- `timeout` - Connection timeout in milliseconds (default: 2000)

##### `setRoute(source: number, target: number): Promise<void>`

Changes video routing by connecting a source input to a target output.

- `source` - Input port number (0-based)
- `target` - Output port number (0-based)

##### `disconnect(): void`

Closes the connection to the VideoHub device.

#### Events

The client emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `void` | Fired when successfully connected |
| `disconnected` | `void` | Fired when connection is closed |
| `error` | `Error` | Fired when an error occurs |
| `protocol` | `{version: string}` | Protocol version information |
| `deviceInfo` | `{model: string, version: string, uniqueId: string}` | Device capabilities |
| `inputLabels` | `Map<number, string>` | Input port labels |
| `outputLabels` | `Map<number, string>` | Output port labels |
| `outputLocks` | `Map<number, OutputLock>` | Output lock states |
| `outputRouting` | `Route[]` | Current routing configuration |
| `config` | `object` | Device configuration settings |

#### Types

```typescript
interface Route {
  source: number;
  target: number;
}

enum OutputLock {
  Local = 'O',
  Extern = 'L',
  Unlocked = 'U'
}
```

## Examples

### Monitor All Device Changes

```typescript
import { VideohubClient } from 'bmd-videohub-client';

const client = new VideohubClient();

client.on('connected', () => {
  console.log('Connected to VideoHub');
});

client.on('inputLabels', (labels) => {
  console.log('Input labels updated:', labels);
});

client.on('outputRouting', (routes) => {
  routes.forEach(route => {
    console.log(`Output ${route.target} ← Input ${route.source}`);
  });
});

client.on('outputLocks', (locks) => {
  console.log('Lock states:', locks);
});

await client.connect('192.168.1.100');
```

### Batch Routing Changes

```typescript
const routingChanges = [
  { source: 0, target: 0 },
  { source: 1, target: 1 },
  { source: 2, target: 2 }
];

for (const route of routingChanges) {
  await client.setRoute(route.source, route.target);
  // Operations are automatically queued to prevent conflicts
}
```

### Error Handling

```typescript
client.on('error', (error) => {
  console.error('VideoHub error:', error.message);
});

try {
  await client.connect('192.168.1.100', 9990, 5000);
} catch (error) {
  console.error('Failed to connect:', error.message);
}
```

## Protocol Support

This library implements the BlackMagic Design VideoHub Ethernet Protocol v2.3. It supports:

- Protocol version negotiation
- Device information queries
- Input/output label management
- Routing table updates
- Output lock state monitoring
- Configuration management

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
git clone https://github.com/lukirs95/bmd-videohub-client.git
cd bmd-videohub-client
npm install
```

### Scripts

```bash
npm run build      # Compile TypeScript
npm run clean      # Remove dist directory
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Testing

The library includes comprehensive tests with mocked TCP connections:

```bash
npm test
```

Tests cover:
- Connection management
- Protocol message parsing
- Routing operations
- Error handling scenarios
- Event emission

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

- 📖 [Documentation](https://github.com/lukirs95/bmd-videohub-client#readme)
- 🐛 [Issues](https://github.com/lukirs95/bmd-videohub-client/issues)
- 💬 [Discussions](https://github.com/lukirs95/bmd-videohub-client/discussions)

## Related

- [BlackMagic Design VideoHub Protocol Documentation](https://www.blackmagicdesign.com/)
- [Node.js EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter)

---

Made with ❤️ for the broadcast community