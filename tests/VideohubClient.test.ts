import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { Socket } from 'node:net';
import { VideohubClient } from '../src/index';
import { Protocol, DeviceInfo, InputLabels, OutputLabels, OutputLocks, Route, Configuration, OutputLock } from '../src/types';

// Mock the net module
jest.mock('node:net');

describe('VideohubClient', () => {
  let client: VideohubClient;
  let mockSocket: jest.Mocked<Socket>;

  // Example data from actual device
  const EXAMPLE_PROTOCOL_DATA = `PROTOCOL PREAMBLE:
Version: 2.8

`;

  const EXAMPLE_DEVICE_DATA = `VIDEOHUB DEVICE:
Device present: true
Model name: Blackmagic Smart Videohub 40 x 40
Friendly name: HD 9 Bildtechnik
Unique ID: 7C2E0D02B577
Video inputs: 40
Video processing units: 0
Video outputs: 40
Video monitoring outputs: 0
Serial ports: 0

`;

  const EXAMPLE_INPUT_LABELS_DATA = `INPUT LABELS:
0 IN 1
1 IN 2
2 IN 3
3 IN 4
4 IN 5
5 IN 6
6 IN 7
7 IN 8
8 IN 9
9 IN 10
10 IN 11
11 IN 12
12 IN 13
13 IN 14
14 IN 15
15 Input 16
16 Input 17
17 Input 18
18 Input 19
19 Input 20
20 Input 21
21 Input 22
22 Input 23
23 Input 24
24 Input 25
25 Input 26
26 Input 27
27 Input 28
28 Input 29
29 Input 30
30 Input 31
31 Input 32
32 Input 33
33 Input 34
34 Input 35
35 Input 36
36 Input 37
37 Input 38
38 Input 39
39 Input 40

`;

  const EXAMPLE_OUTPUT_LABELS_DATA = `OUTPUT LABELS:
0 OUT 1
1 OUT 2
2 OUT 3
3 OUT 4
4 OUT 5
5 OUT 6
6 OUT 7
7 OUT 8
8 OUT 9
9 OUT 10
10 OUT 11
11 OUT 12
12 Output 13
13 Output 14
14 Output 15
15 Output 16
16 Output 17
17 Output 18
18 Output 19
19 Output 20
20 Output 21
21 Output 22
22 Output 23
23 Output 24
24 Output 25
25 Output 26
26 Output 27
27 Output 28
28 Output 29
29 Output 30
30 Output 31
31 Output 32
32 Output 33
33 Output 34
34 Output 35
35 Output 36
36 Output 37
37 Output 38
38 Output 39
39 Output 40

`;

  const EXAMPLE_OUTPUT_LOCKS_DATA = `VIDEO OUTPUT LOCKS:
0 U
1 U
2 U
3 U
4 U
5 U
6 U
7 U
8 U
9 U
10 U
11 U
12 U
13 U
14 U
15 U
16 U
17 U
18 U
19 U
20 U
21 U
22 U
23 U
24 U
25 U
26 U
27 U
28 U
29 U
30 U
31 U
32 U
33 U
34 U
35 U
36 U
37 U
38 U
39 U

`;

  const EXAMPLE_ROUTING_DATA = `VIDEO OUTPUT ROUTING:
0 0
1 16
2 15
3 30
4 26
5 26
6 26
7 26
8 24
9 25
10 26
11 10
12 11
13 24
14 25
15 30
16 0
17 0
18 0
19 0
20 0
21 0
22 0
23 0
24 26
25 26
26 26
27 26
28 26
29 26
30 26
31 26
32 32
33 33
34 34
35 35
36 36
37 37
38 38
39 39

`;

  const EXAMPLE_CONFIG_DATA = `CONFIGURATION:
Take Mode: false

`;

  const EXAMPLE_END_PRELUDE = `END PRELUDE:

`;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock socket
    mockSocket = {
      setKeepAlive: jest.fn(),
      setNoDelay: jest.fn(),
      setEncoding: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
      connect: jest.fn(),
      write: jest.fn(),
      removeAllListeners: jest.fn(),
      resetAndDestroy: jest.fn(),
      destroy: jest.fn(),
    } as any;

    // Mock the Socket constructor
    (Socket as jest.MockedClass<typeof Socket>).mockImplementation(() => mockSocket);

    client = new VideohubClient('192.168.1.100', 9990);
  });

  describe('Constructor', () => {
    test('should create instance with correct host and port', () => {
      expect(client).toBeInstanceOf(VideohubClient);
      expect(client).toBeInstanceOf(EventEmitter);
    });

    test('should use default port 9990', () => {
      const defaultClient = new VideohubClient('192.168.1.100');
      expect(defaultClient).toBeInstanceOf(VideohubClient);
    });
  });

  describe('Connection Management', () => {
    test('should configure socket properly on connect', async () => {
      // Mock successful connection
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      const connectPromise = client.connect();
      await connectPromise;

      expect(mockSocket.setKeepAlive).toHaveBeenCalledWith(true);
      expect(mockSocket.setNoDelay).toHaveBeenCalledWith(true);
      expect(mockSocket.setEncoding).toHaveBeenCalledWith('ascii');
      expect(mockSocket.connect).toHaveBeenCalledWith(9990, '192.168.1.100');
    });

    test('should handle connection timeout', async () => {
      // Don't trigger the connect callback to simulate timeout
      mockSocket.once.mockImplementation(() => mockSocket);

      await expect(client.connect(100)).rejects.toThrow('Connection timeout');
    });

    test('should handle connection error', async () => {
      const testError = new Error('Connection failed');
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(testError), 0);
        }
        return mockSocket;
      });

      await expect(client.connect()).rejects.toBe(testError);
    });

  });

  describe('Data Parsing', () => {
    let onDataCallback: Function;

    beforeEach(async () => {
      // Setup connection and capture the data callback
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          onDataCallback = callback;
        }
        return mockSocket;
      });

      await client.connect();
    });

    test('should parse protocol preamble data', (done) => {
      client.on('preamble', (protocol: Protocol) => {
        expect(protocol).toEqual({
          version: '2.8'
        });
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_PROTOCOL_DATA));
    });

    test('should parse device info data', (done) => {
      client.on('deviceInfo', (deviceInfo: DeviceInfo) => {
        expect(deviceInfo).toEqual({
          devicePresent: true,
          modelName: 'Blackmagic Smart Videohub 40 x 40',
          friendlyName: 'HD 9 Bildtechnik',
          uniqueId: '7C2E0D02B577',
          videoInputs: 40,
          videoProcessingUnits: 0,
          videoOutputs: 40,
          videoMonitoringOutputs: 0,
          serialPorts: 0
        });
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_DEVICE_DATA));
    });

    test('should parse input labels data', (done) => {
      client.on('inputLabels', (inputLabels: InputLabels) => {
        expect(inputLabels.size).toBe(40);
        expect(inputLabels.get(0)).toBe('IN 1');
        expect(inputLabels.get(1)).toBe('IN 2');
        expect(inputLabels.get(15)).toBe('Input 16');
        expect(inputLabels.get(39)).toBe('Input 40');
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_INPUT_LABELS_DATA));
    });

    test('should parse output labels data', (done) => {
      client.on('outputLabels', (outputLabels: OutputLabels) => {
        expect(outputLabels.size).toBe(40);
        expect(outputLabels.get(0)).toBe('OUT 1');
        expect(outputLabels.get(11)).toBe('OUT 12');
        expect(outputLabels.get(12)).toBe('Output 13');
        expect(outputLabels.get(39)).toBe('Output 40');
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_OUTPUT_LABELS_DATA));
    });

    test('should parse output locks data', (done) => {
      client.on('outputLocks', (outputLocks: OutputLocks) => {
        expect(outputLocks.size).toBe(40);
        expect(outputLocks.get(0)).toBe(OutputLock.Unlocked);
        expect(outputLocks.get(20)).toBe(OutputLock.Unlocked);
        expect(outputLocks.get(39)).toBe(OutputLock.Unlocked);
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_OUTPUT_LOCKS_DATA));
    });

    test('should parse routing data', (done) => {
      client.on('routes', (routes: Route[]) => {
        expect(routes).toHaveLength(40);
        expect(routes[0]).toEqual({ source: 0, target: 0 });
        expect(routes[1]).toEqual({ source: 16, target: 1 });
        expect(routes[2]).toEqual({ source: 15, target: 2 });
        expect(routes[3]).toEqual({ source: 30, target: 3 });
        expect(routes[39]).toEqual({ source: 39, target: 39 });
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_ROUTING_DATA));
    });

    test('should parse configuration data', (done) => {
      client.on('configuration', (config: Configuration) => {
        expect(config).toEqual({
          takeMode: false
        });
        done();
      });

      onDataCallback(Buffer.from(EXAMPLE_CONFIG_DATA));
    });

    test('should handle end prelude', (done) => {
      // Since END PRELUDE just calls noop, we test that no error is thrown
      expect(() => {
        onDataCallback(Buffer.from(EXAMPLE_END_PRELUDE));
        done();
      }).not.toThrow();
    });

    test('should handle multiple messages in single data chunk', (done) => {
      let eventCount = 0;
      const expectedEvents = 3;

      const handleEvent = () => {
        eventCount++;
        if (eventCount === expectedEvents) {
          done();
        }
      };

      client.on('preamble', handleEvent);
      client.on('deviceInfo', handleEvent);
      client.on('inputLabels', handleEvent);

      const combinedData = EXAMPLE_PROTOCOL_DATA + EXAMPLE_DEVICE_DATA + EXAMPLE_INPUT_LABELS_DATA;
      onDataCallback(Buffer.from(combinedData));
    });

    test('should handle fragmented messages', (done) => {
      client.on('preamble', (protocol: Protocol) => {
        expect(protocol.version).toBe('2.8');
        done();
      });

      // Send data in fragments
      const data = EXAMPLE_PROTOCOL_DATA;
      const midPoint = Math.floor(data.length / 2);

      onDataCallback(Buffer.from(data.substring(0, midPoint)));
      onDataCallback(Buffer.from(data.substring(midPoint)));
    });

    test('should emit ack event', (done) => {
      client.on('ack', () => {
        done();
      });

      onDataCallback(Buffer.from('ACK\n\n'));
    });

    test('should emit nak event', (done) => {
      client.on('nak', () => {
        done();
      });

      onDataCallback(Buffer.from('NAK\n\n'));
    });
  });

  describe('setRoute Method', () => {
    beforeEach(async () => {
      // Setup successful connection
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      await client.connect();
    });

    test('should send correct routing command', async () => {
      // Setup client to listen for ack and emit it
      let ackCallback: Function;
      (client as any).once = jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'ack') {
          ackCallback = callback;
          setTimeout(() => ackCallback(), 10);
        }
      });

      const route: Route = { source: 5, target: 10 };

      const routePromise = client.setRoute(route);
      await routePromise;

      expect(mockSocket.write).toHaveBeenCalledWith(
        'VIDEO OUTPUT ROUTING:\n10 5\n\n',
        'ascii'
      );
    });

    test('should reject when another operation is pending', async () => {
      // Make the first operation not resolve immediately
      (client as any).once = jest.fn().mockImplementation((event: string, callback: Function) => {
        // Don't call the callback to simulate pending operation
      });

      const route1: Route = { source: 1, target: 2 };
      const route2: Route = { source: 3, target: 4 };

      // Start first operation (will be pending)
      const promise1 = client.setRoute(route1);

      // Second operation should be rejected immediately
      await expect(client.setRoute(route2)).rejects.toThrow('Another operation is pending');
    });

    test('should handle ack response', async () => {
      let ackCallback: Function;
      (client as any).once = jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'ack') {
          ackCallback = callback;
          setTimeout(() => ackCallback(), 10);
        }
      });

      const route: Route = { source: 15, target: 20 };
      await expect(client.setRoute(route)).resolves.toBeUndefined();
    });

    test('should handle nak response', async () => {
      let nakCallback: Function;
      (client as any).once = jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'nak') {
          nakCallback = callback;
          setTimeout(() => nakCallback(), 10);
        }
      });

      const route: Route = { source: 100, target: 200 }; // Invalid route
      await expect(client.setRoute(route)).rejects.toBeUndefined();
    });

    test('should handle timeout during operation', async () => {
      // Don't emit ack or nak to simulate timeout
      (client as any).once = jest.fn().mockImplementation(() => client);

      const route: Route = { source: 1, target: 2 };
      await expect(client.setRoute(route)).rejects.toBe('timeout');
    });

    test('should reset pending operation flag after timeout', async () => {
      // First operation times out
      (client as any).once = jest.fn().mockImplementation(() => {});

      const route1: Route = { source: 1, target: 2 };
      await expect(client.setRoute(route1)).rejects.toBe('timeout');

      // Second operation should work after timeout
      let ackCallback: Function;
      (client as any).once = jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'ack') {
          ackCallback = callback;
          setTimeout(() => ackCallback(), 10);
        }
      });

      const route2: Route = { source: 3, target: 4 };
      await expect(client.setRoute(route2)).resolves.toBeUndefined();
    });
  });

  describe('Label Methods', () => {
    test('should send an input label command', async () => {
      const write = jest.spyOn(client as any, 'write').mockResolvedValue(undefined);
      await client.setInputLabel(3, 'Camera 4');
      expect(write).toHaveBeenCalledWith('INPUT LABELS:\n3 Camera 4\n\n');
    });

    test('should send an output label command', async () => {
      const write = jest.spyOn(client as any, 'write').mockResolvedValue(undefined);
      await client.setOutputLabel(5, 'Program');
      expect(write).toHaveBeenCalledWith('OUTPUT LABELS:\n5 Program\n\n');
    });

    test('should reject line breaks in labels', async () => {
      await expect(client.setInputLabel(0, 'Camera\nOUTPUT LABELS:')).rejects.toThrow('Labels cannot contain line breaks');
    });
  });

  describe('Error Handling', () => {
    test('should emit error event from socket', (done) => {
      const testError = new Error('Socket error');

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(testError), 0);
        }
        return mockSocket;
      });

      client.on('error', (error: Error | null) => {
        expect(error).toBe(testError);
        done();
      });

      // Simulate connection to trigger error handler setup
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      client.connect();
    });

    test('should emit close event from socket', (done) => {
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      client.on('close', () => {
        done();
      });

      // Simulate connection to trigger close handler setup
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      client.connect();
    });

    test('should handle malformed data gracefully', () => {
      let onDataCallback: Function;

      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          onDataCallback = callback;
        }
        return mockSocket;
      });

      client.connect().then(() => {
        // Test malformed data doesn't crash the client
        expect(() => {
          onDataCallback(Buffer.from('INVALID HEADER:\nsome data\n\n'));
          onDataCallback(Buffer.from('INCOMPLETE\n'));
          onDataCallback(Buffer.from('\n\n'));
          onDataCallback(Buffer.from(''));
        }).not.toThrow();
      });
    });

    test('should clean up socket on close', (done) => {
      let closeCallback: Function;

      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          closeCallback = callback;
        }
        return mockSocket;
      });

      client.on('close', () => {
        expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        expect(mockSocket.destroy).toHaveBeenCalled();
        done();
      });

      // Simulate connection to trigger close handler setup
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => {
            callback();
            // Trigger close after connection
            setTimeout(() => closeCallback(), 10);
          }, 0);
        }
        return mockSocket;
      });

      client.connect();
    });
  });
});
