import { VideohubClient } from './src/index.js';

async function main() {
  const client = new VideohubClient('192.168.0.1', 9990);

  // Set up event listeners
  client.on('preamble', (protocol) => {
    console.log(`Connected to VideoHub protocol version: ${protocol.version}`);
  });

  client.on('deviceInfo', (deviceInfo) => {
    console.log(`Device: ${deviceInfo.modelName} (${deviceInfo.friendlyName})`);
    console.log(`Inputs: ${deviceInfo.videoInputs}, Outputs: ${deviceInfo.videoOutputs}`);
  });

  client.on('inputLabels', (inputLabels) => {
    console.log('Input Labels:');
    inputLabels.forEach((label, index) => {
      console.log(`  ${index}: ${label}`);
    });
  });

  client.on('outputLabels', (outputLabels) => {
    console.log('Output Labels:');
    outputLabels.forEach((label, index) => {
      console.log(`  ${index}: ${label}`);
    });
  });

  client.on('routes', (routes) => {
    console.log('Current Routing:');
    routes.forEach((route) => {
      console.log(`  Output ${route.target} <- Input ${route.source}`);
    });
  });

  client.on('error', (error) => {
    console.error('Connection error:', error);
    process.exit(1);
  });

  client.on('close', () => {
    console.log('Connection closed');
  });

  try {
    // Connect to VideoHub
    console.log('Connecting to VideoHub...');
    await client.connect();

    // Wait a moment for initial data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example: Route input 5 to output 10
    console.log('Setting route: Input 5 -> Output 10');
    await client.setRoute({ source: 3, target: 0 });
    console.log('Route set successfully!');

    // Disconnect after 2 seconds
    setTimeout(async () => {
      console.log('Disconnecting...');
      await client.disconnect();
    }, 2000);

  } catch (error) {
    console.error('Failed to connect:', error);
    process.exit(1);
  }
}

main().catch(console.error);